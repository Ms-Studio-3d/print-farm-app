function safeDivide(numerator, denominator, fallback = 0) {
  const top = Number(numerator || 0);
  const bottom = Number(denominator || 0);
  return Number.isFinite(top) && Number.isFinite(bottom) && bottom > 0 ? top / bottom : fallback;
}

function inferPercent(part, base, fallback = 0) {
  const value = safeDivide(part, base, fallback / 100) * 100;
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function recalculateEditedOrderCosts(oldOrder, printHours, manualMinutes, printerId) {
  const quantity = Math.max(1, Number(oldOrder.quantity || 1));
  const oldPrintHours = Number(oldOrder.printHours || 0);
  const oldManualMinutes = Number(oldOrder.manualMinutes || 0);

  const materialCost = Number(oldOrder.materialCost || 0);
  const wasteCost = Number(oldOrder.wasteCost || 0);
  const packagingCost = Number(oldOrder.packagingCost || 0);
  const accessoriesCost = Number(oldOrder.accessoriesCost || 0);
  const shippingCost = Number(oldOrder.shippingCost || 0);

  const oldDepreciationCost = Number(oldOrder.depreciationCost || 0);
  const oldElectricityCost = Number(oldOrder.electricityCost || 0);
  const oldLaborCost = Number(oldOrder.laborCost || 0);
  const oldRiskCost = Number(oldOrder.riskCost || 0);
  const oldTaxCost = Number(oldOrder.taxCost || 0);

  const previousMachineHourCost = safeDivide(oldDepreciationCost, oldPrintHours, 0);
  const selectedPrinter = printerId ? getPrinterById(printerId) : null;
  const machineRunHourCost = selectedPrinter
    ? (typeof getPrinterOperatingCostPerHour === 'function'
      ? getPrinterOperatingCostPerHour(selectedPrinter)
      : toPositiveNumber(selectedPrinter.hourlyDepreciation, 0))
    : previousMachineHourCost;
  const assetHourCost = selectedPrinter && typeof getAssetsHourlyDepreciation === 'function'
    ? getAssetsHourlyDepreciation({ printer: selectedPrinter })
    : 0;
  const maintenanceHourCost = selectedPrinter && typeof getMaintenanceCostPerHour === 'function'
    ? getMaintenanceCostPerHour()
    : 0;
  const machineHourCost = selectedPrinter
    ? machineRunHourCost + assetHourCost + maintenanceHourCost
    : previousMachineHourCost;

  const electricityCostPerHour = safeDivide(oldElectricityCost, oldPrintHours, getConfigNumber('electricityCostPerHour'));
  const laborRate = safeDivide(oldLaborCost, oldManualMinutes / 60, getConfigNumber('laborRate'));

  const oldProductionSubtotal = materialCost + wasteCost + oldDepreciationCost + oldElectricityCost + oldLaborCost + packagingCost;
  const failurePercent = inferPercent(oldRiskCost, oldProductionSubtotal, getConfigNumber('failurePercent'));
  const oldProductionCostAfterRisk = oldProductionSubtotal + oldRiskCost;
  const taxPercent = inferPercent(oldTaxCost, oldProductionCostAfterRisk, getConfigNumber('defaultTaxPercent'));

  const depreciationCost = Number(printHours || 0) * machineHourCost;
  const electricityCost = Number(printHours || 0) * electricityCostPerHour;
  const laborCost = (Number(manualMinutes || 0) / 60) * laborRate;

  const pricing = calculateMoo3dPricing({
    quantity,
    materialCost,
    wasteCost,
    depreciationCost,
    electricityCost,
    laborCost,
    packagingCost,
    accessoriesCost: accessoriesCost / quantity,
    shippingCost,
    failurePercent,
    taxPercent,
    profitMargin: 0,
    discountValue: 0,
    minimumOrderPrice: 0,
    roundingStep: 1
  });

  return {
    quantity,
    materialCost: roundMoney(materialCost),
    wasteWeight: roundMoney(Number(oldOrder.wasteWeight || 0)),
    wasteCost: roundMoney(wasteCost),
    depreciationCost: roundMoney(pricing.depreciationCost),
    electricityCost: roundMoney(pricing.electricityCost),
    laborCost: roundMoney(pricing.laborCost),
    packagingCost: roundMoney(packagingCost),
    accessoriesCost: roundMoney(pricing.accessoriesCost),
    shippingCost: roundMoney(pricing.shippingCost),
    riskCost: roundMoney(pricing.riskCost),
    taxCost: roundMoney(pricing.taxCost),
    totalCost: roundMoney(pricing.totalCost),
    directAddOnsCost: roundMoney(pricing.directAddOnsCost)
  };
}

function openEditSale(code) {
  const order = getOrderByCode(code);

  if (!order) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  editingOrderCode = code;

  setValue('editCode', order.code || '');
  setValue('editDate', order.date || '');
  setValue('editItemName', order.itemName || '');
  setValue('editCustomerName', order.customerName || '');
  setValue('editPrinter', order.printerId || '');
  const printParts = splitHoursToParts(order.printHours || 0);
  setValue('editPrintHours', printParts.hours);
  setValue('editPrintMinutes', printParts.minutes);
  setValue('editManualMinutes', order.manualMinutes || 0);
  setValue('editFinalPrice', order.finalPrice || 0);
  setValue('editNotes', order.notes || '');

  openModal('editModal');
}

async function saveEditSale() {
  if (savingEdit || !editingOrderCode) return;
  savingEdit = true;

  try {
    const oldOrder = getOrderByCode(editingOrderCode);

  if (!oldOrder) {
    showToast('الأوردر غير موجود', 'error');
    closeModal('editModal');
    return;
  }

  const itemName = getTrimmedValue('editItemName');
  const date = getValue('editDate');

  if (!itemName) {
    showToast('اسم المجسم مطلوب', 'error');
    $('editItemName')?.focus();
    return;
  }

  if (!date) {
    showToast('تاريخ الأوردر مطلوب', 'error');
    $('editDate')?.focus();
    return;
  }

  const finalPrice = toPositiveNumber(getValue('editFinalPrice'), Number(oldOrder.finalPrice || 0));
  const printerId = getValue('editPrinter') ? Number(getValue('editPrinter')) : null;
  const printHours = getPrintHoursFromInputs('edit');
  const manualMinutes = toPositiveNumber(getValue('editManualMinutes'), Number(oldOrder.manualMinutes || 0));

  if (!printerId) {
    showToast('اختار الطابعة المستخدمة', 'error');
    $('editPrinter')?.focus();
    return;
  }

  if (printHours <= 0) {
    showToast('وقت الطباعة لازم يكون أكبر من صفر', 'error');
    $('editPrintHours')?.focus();
    return;
  }
  const recalculated = recalculateEditedOrderCosts(oldOrder, printHours, manualMinutes, printerId);
  const minimumNoLossPrice = recalculated.totalCost + recalculated.directAddOnsCost;

  if (finalPrice < minimumNoLossPrice) {
    showToast(`سعر البيع أقل من التكلفة الجديدة: الحد الأدنى ${formatMoney(minimumNoLossPrice)}`, 'error');
    return;
  }

  const profit = roundMoney(finalPrice - recalculated.totalCost - recalculated.directAddOnsCost);
  const quantity = Math.max(1, recalculated.quantity);

  const payload = {
    code: editingOrderCode,
    date,
    itemName,
    customerName: getTrimmedValue('editCustomerName'),
    printerId,
    status: oldOrder.status || 'delivered',
    quantity,
    printHours,
    manualMinutes,
    notes: getTrimmedValue('editNotes'),

    materialCost: recalculated.materialCost,
    wasteWeight: recalculated.wasteWeight,
    wasteCost: recalculated.wasteCost,
    depreciationCost: recalculated.depreciationCost,
    electricityCost: recalculated.electricityCost,
    laborCost: recalculated.laborCost,
    packagingCost: recalculated.packagingCost,
    accessoriesCost: recalculated.accessoriesCost,
    shippingCost: recalculated.shippingCost,
    riskCost: recalculated.riskCost,
    taxCost: recalculated.taxCost,
    totalCost: recalculated.totalCost,
    priceBeforeDiscount: finalPrice,
    discountValue: 0,
    priceAfterDiscount: finalPrice,
    minimumOrderPrice: Number(oldOrder.minimumOrderPrice || 0),
    roundedAdjustment: 0,
    finalPrice,
    profit,
    unitFinalPrice: roundMoney(finalPrice / quantity),
    unitTotalCost: roundMoney(recalculated.totalCost / quantity),
    unitProfit: roundMoney(profit / quantity)
  };

  const response = await window.farmAPI.updateOrder(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في تعديل الأوردر', 'error');
    return;
  }

  showToast('تم تعديل الأوردر بنجاح');
  closeModal('editModal');
  editingOrderCode = null;
  await loadDashboardData();

  if (isModalOpen('reportsModal')) renderReportsTable();
  if (isModalOpen('pipelineModal')) renderPipeline();
  } finally {
    savingEdit = false;
  }
}

async function deleteSale(code) {
  const confirmed = await askConfirm(`هل تريد حذف الأوردر ${code}؟ سيتم استرجاع الخامات للمخزون.`);

  if (!confirmed) return;

  const response = await window.farmAPI.deleteOrder({ code });

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الأوردر', 'error');
    return;
  }

  showToast('تم حذف الأوردر واسترجاع المخزون');
  await loadDashboardData();

  if (isModalOpen('reportsModal')) renderReportsTable();
  if (isModalOpen('pipelineModal')) renderPipeline();
}
