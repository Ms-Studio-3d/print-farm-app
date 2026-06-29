function roundUpByStep(value, step) {
  const safeValue = Number(value || 0);
  const safeStep = Number(step || 5);
  if (!Number.isFinite(safeStep) || safeStep <= 0) return safeValue;
  return Math.ceil(safeValue / safeStep) * safeStep;
}

function calc() {
  const materialUsage = getMaterialUsageFromInputs();
  const printHours = toPositiveNumber(getValue('printHours'), 0);
  const manualMinutes = toPositiveNumber(getValue('manualMins'), 0);

  const profitMargin = toPositiveNumber(getValue('profitMargin'), getConfigNumber('defaultProfitMargin'));
  const discountValue = toPositiveNumber(getValue('discountValue'), getConfigNumber('defaultDiscountValue'));
  const packagingCost = toPositiveNumber(getValue('packagingCost'), getConfigNumber('packagingCost'));

  // في طريقة MOO3D الجديدة: الإكسسوارات / الشحن / المصاريف المباشرة
  // بتتضاف على سعر البيع فقط، ومش بيتحسب عليها فشل ولا مكسب.
  const directAddOnsCost = toPositiveNumber(getValue('shippingCost'), getConfigNumber('shippingCost'));

  const laborRate = toPositiveNumber(getValue('laborRate'), getConfigNumber('laborRate'));
  const electricityCostPerHour = toPositiveNumber(getValue('electricityCostPerHour'), getConfigNumber('electricityCostPerHour'));
  const failurePercent = toPositiveNumber(getValue('failurePercent'), getConfigNumber('failurePercent'));
  const wasteWeight = toPositiveNumber(getValue('wasteWeight'), getConfigNumber('defaultWasteWeight'));
  const minimumOrderPrice = toPositiveNumber(getValue('minimumOrderPrice'), getConfigNumber('minimumOrderPrice'));
  const defaultTaxPercent = toPositiveNumber(getValue('defaultTaxPercent'), getConfigNumber('defaultTaxPercent'));
  const roundingStep = toPositiveNumber(getConfigNumber('roundingStep'), 5);

  const materialCost = materialUsage.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
  const totalMaterialGrams = materialUsage.reduce((sum, entry) => sum + Number(entry.grams || 0), 0);
  const weightedGramPrice = totalMaterialGrams > 0 ? materialCost / totalMaterialGrams : 0;
  const wasteCost = wasteWeight * weightedGramPrice;

  const selectedPrinterId = getValue('selectedPrinter');
  const printer = selectedPrinterId ? getPrinterById(selectedPrinterId) : null;
  const machineHourCost = toPositiveNumber(printer?.hourlyDepreciation, 0);
  const depreciationCost = printHours * machineHourCost;
  const electricityCost = printHours * electricityCostPerHour;
  const laborCost = (manualMinutes / 60) * laborRate;

  // نفس منطق MOO3D الجديد:
  // تكلفة إنتاج فقط = خامة + هالك + ماكينة + كهرباء + شغل يدوي + تغليف.
  // بعدها نضيف فشل / مخاطرة على تكلفة الإنتاج فقط.
  // بعدها نحسب المكسب على تكلفة الإنتاج النهائية.
  // وبعد كده نضيف المصاريف المباشرة بدون مكسب وبدون فشل.
  const productionSubtotal = materialCost + wasteCost + depreciationCost + electricityCost + laborCost + packagingCost;
  const riskCost = productionSubtotal * (failurePercent / 100);
  const productionCostAfterRisk = productionSubtotal + riskCost;

  // الضريبة اختيارية وموجودة في البرنامج القديم. لو صفر يبقى الحساب مطابق لطريقة MOO3D الجديدة.
  const taxCost = productionCostAfterRisk * (defaultTaxPercent / 100);
  const totalCost = productionCostAfterRisk + taxCost;

  const sellBeforeAddOns = totalCost * (1 + (profitMargin / 100));
  const priceBeforeDiscount = sellBeforeAddOns + directAddOnsCost;
  const safeDiscountValue = Math.min(discountValue, priceBeforeDiscount);
  const priceAfterDiscountBeforeMinimum = Math.max(0, priceBeforeDiscount - safeDiscountValue);
  const priceAfterDiscount = Math.max(priceAfterDiscountBeforeMinimum, minimumOrderPrice);
  const finalPrice = roundUpByStep(priceAfterDiscount, roundingStep);
  const roundedAdjustment = finalPrice - priceAfterDiscount;

  // مهم: المصاريف المباشرة مش ربح.
  const profit = finalPrice - totalCost - directAddOnsCost;

  setText('resMat', formatMoney(materialCost));
  setText('resWaste', formatMoney(wasteCost));
  setText('resDep', formatMoney(depreciationCost));
  setText('resElectricity', formatMoney(electricityCost));
  setText('resLabor', formatMoney(laborCost));
  setText('resPackaging', formatMoney(packagingCost));
  setText('resShipping', formatMoney(directAddOnsCost));
  setText('resRisk', formatMoney(riskCost));
  setText('resTax', formatMoney(taxCost));
  setText('resTotal', formatMoney(totalCost));
  setText('resBeforeDiscount', formatMoney(priceBeforeDiscount));
  setText('resDiscount', formatMoney(safeDiscountValue));
  setText('resMinimum', formatMoney(minimumOrderPrice));
  setText('resRoundedAdjustment', formatMoney(roundedAdjustment));
  setText('resFinal', formatMoney(finalPrice));
  setText('resProfit', formatMoney(profit));

  currentCalc = {
    materialCost: roundMoney(materialCost),
    wasteWeight: roundMoney(wasteWeight),
    wasteCost: roundMoney(wasteCost),
    depreciationCost: roundMoney(depreciationCost),
    electricityCost: roundMoney(electricityCost),
    laborCost: roundMoney(laborCost),
    packagingCost: roundMoney(packagingCost),
    shippingCost: roundMoney(directAddOnsCost),
    riskCost: roundMoney(riskCost),
    taxCost: roundMoney(taxCost),
    totalCost: roundMoney(totalCost),
    priceBeforeDiscount: roundMoney(priceBeforeDiscount),
    discountValue: roundMoney(safeDiscountValue),
    priceAfterDiscount: roundMoney(priceAfterDiscount),
    minimumOrderPrice: roundMoney(minimumOrderPrice),
    roundedAdjustment: roundMoney(roundedAdjustment),
    finalPrice: roundMoney(finalPrice),
    profit: roundMoney(profit),
    materialUsage
  };
}

function resetResultsPanel() {
  setText('resMat', formatMoney(0));
  setText('resWaste', formatMoney(0));
  setText('resDep', formatMoney(0));
  setText('resElectricity', formatMoney(0));
  setText('resLabor', formatMoney(0));
  setText('resPackaging', formatMoney(0));
  setText('resShipping', formatMoney(0));
  setText('resRisk', formatMoney(0));
  setText('resTax', formatMoney(0));
  setText('resTotal', formatMoney(0));
  setText('resBeforeDiscount', formatMoney(0));
  setText('resDiscount', formatMoney(0));
  setText('resMinimum', formatMoney(0));
  setText('resRoundedAdjustment', formatMoney(0));
  setText('resFinal', formatMoney(0));
  setText('resProfit', formatMoney(0));
}

function resetOrderForm() {
  setValue('itemName', '');
  setValue('customerName', '');
  setValue('selectedPrinter', '');
  setValue('printHours', '0');
  setValue('opDate', new Date().toISOString().slice(0, 10));
  setValue('orderStatus', 'new');
  setValue('orderNotes', '');
  document.querySelectorAll('.ams-weight').forEach((input) => {
    input.value = '';
  });
  applyConfigToInputs();
  currentCalc = createEmptyCalc();
  resetResultsPanel();
  setNextOrderCode();
  calc();
}

function validateOrderBeforeSave() {
  const itemName = getTrimmedValue('itemName');
  const printHours = toPositiveNumber(getValue('printHours'), 0);
  const printerId = getValue('selectedPrinter');
  const materialUsage = getMaterialUsageFromInputs();

  if (!itemName) {
    showToast('اسم المجسم مطلوب', 'error');
    $('itemName')?.focus();
    return { valid: false };
  }

  if (!printerId) {
    showToast('اختار الطابعة المستخدمة', 'error');
    $('selectedPrinter')?.focus();
    return { valid: false };
  }

  if (printHours <= 0) {
    showToast('وقت الطباعة لازم يكون أكبر من صفر', 'error');
    $('printHours')?.focus();
    return { valid: false };
  }

  if (!materialUsage.length) {
    showToast('أدخل استهلاك خامة واحدة على الأقل', 'error');
    return { valid: false };
  }

  for (const item of materialUsage) {
    if (Number(item.grams || 0) > Number(item.remaining || 0)) {
      showToast(`المخزون غير كافٍ في ${item.materialName}`, 'error');
      return { valid: false };
    }
  }

  if (Number(currentCalc.totalCost || 0) <= 0 || Number(currentCalc.finalPrice || 0) <= 0) {
    showToast('راجع بيانات التسعير أولًا', 'error');
    return { valid: false };
  }

  const minimumNoLossPrice = Number(currentCalc.totalCost || 0) + Number(currentCalc.shippingCost || 0);
  if (Number(currentCalc.finalPrice || 0) < minimumNoLossPrice) {
    showToast('سعر البيع أقل من التكلفة والمصاريف المباشرة', 'error');
    return { valid: false };
  }

  return { valid: true, itemName, printerId, materialUsage };
}

async function saveSale() {
  calc();
  const validation = validateOrderBeforeSave();
  if (!validation.valid) return;

  const responseCode = await window.farmAPI.getNextOrderCode();
  if (!responseCode?.success) {
    showToast(responseCode?.message || 'فشل في إنشاء كود الأوردر', 'error');
    return;
  }

  const responseOrderCode = String(responseCode.data || 'ORD-1001');
  const payload = {
    code: responseOrderCode,
    itemName: validation.itemName,
    customerName: getTrimmedValue('customerName'),
    printerId: Number(validation.printerId),
    status: getTrimmedValue('orderStatus', 'new'),
    printHours: toPositiveNumber(getValue('printHours'), 0),
    manualMinutes: toPositiveNumber(getValue('manualMins'), 0),
    notes: getTrimmedValue('orderNotes'),
    date: getValue('opDate') || new Date().toISOString().slice(0, 10),
    materialCost: currentCalc.materialCost,
    wasteWeight: currentCalc.wasteWeight,
    wasteCost: currentCalc.wasteCost,
    depreciationCost: currentCalc.depreciationCost,
    electricityCost: currentCalc.electricityCost,
    laborCost: currentCalc.laborCost,
    packagingCost: currentCalc.packagingCost,
    shippingCost: currentCalc.shippingCost,
    riskCost: currentCalc.riskCost,
    taxCost: currentCalc.taxCost,
    totalCost: currentCalc.totalCost,
    priceBeforeDiscount: currentCalc.priceBeforeDiscount,
    discountValue: currentCalc.discountValue,
    priceAfterDiscount: currentCalc.priceAfterDiscount,
    minimumOrderPrice: currentCalc.minimumOrderPrice,
    roundedAdjustment: currentCalc.roundedAdjustment,
    finalPrice: currentCalc.finalPrice,
    profit: currentCalc.profit,
    materialUsage: validation.materialUsage
  };

  const response = await window.farmAPI.createOrder(payload);
  if (!response?.success) {
    showToast(response?.message || 'فشل في حفظ الأوردر', 'error');
    return;
  }

  showToast('تم تسجيل الأوردر وخصم المخزون بنجاح');
  await loadDashboardData();
  resetOrderForm();
  setActiveNav('order');
}
