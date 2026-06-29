function syncEditPaymentFields(force = false) {
  const finalPrice = toPositiveNumber(getValue('editFinalPrice'), 0);
  const status = normalizePaymentStatus(getValue('editPaymentStatus', 'collected'));
  const paidAmountEl = $('editPaidAmount');
  if (!paidAmountEl) return;

  if (status === 'collected') {
    if (force || !editPaidAmountTouched) paidAmountEl.value = roundMoney(finalPrice);
    return;
  }

  if (status === 'unpaid' || status === 'refunded') {
    paidAmountEl.value = 0;
    editPaidAmountTouched = false;
    return;
  }

  if (status === 'partial') {
    paidAmountEl.value = roundMoney(Math.min(toPositiveNumber(paidAmountEl.value, 0), finalPrice));
  }
}

function getEditPaymentSnapshot(finalPrice) {
  const status = normalizePaymentStatus(getValue('editPaymentStatus', 'collected'));
  const method = normalizePaymentMethod(getValue('editPaymentMethod', 'cash'));
  const paidAmount = getPaidAmountFromStatus(status, finalPrice, getValue('editPaidAmount'));
  return { paymentStatus: status, paymentMethod: method, paidAmount };
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
  setValue('editStatus', order.status || 'new');
  setValue('editPrintHours', order.printHours || 0);
  setValue('editManualMinutes', order.manualMinutes || 0);
  setValue('editFinalPrice', order.finalPrice || 0);
  setValue('editPaymentStatus', normalizePaymentStatus(order.paymentStatus));
  setValue('editPaymentMethod', normalizePaymentMethod(order.paymentMethod));
  setValue('editPaidAmount', getOrderPaidAmount(order));
  editPaidAmountTouched = false;
  setValue('editNotes', order.notes || '');

  openModal('editModal');
}

async function saveEditSale() {
  if (!editingOrderCode) return;

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
  const totalCost = Number(oldOrder.totalCost || 0);
  const shippingCost = Number(oldOrder.shippingCost || 0);
  const minimumNoLossPrice = totalCost + shippingCost;

  if (finalPrice < minimumNoLossPrice) {
    showToast('سعر البيع أقل من التكلفة والمصاريف المباشرة', 'error');
    return;
  }

  const paymentSnapshot = getEditPaymentSnapshot(finalPrice);
  if (paymentSnapshot.paymentStatus === 'partial' && Number(paymentSnapshot.paidAmount || 0) <= 0) {
    showToast('في حالة التحصيل الجزئي لازم تدخل مبلغ محصل', 'error');
    $('editPaidAmount')?.focus();
    return;
  }

  const payload = {
    code: editingOrderCode,
    date,
    itemName,
    customerName: getTrimmedValue('editCustomerName'),
    printerId: getValue('editPrinter') ? Number(getValue('editPrinter')) : null,
    status: getValue('editStatus') || 'new',
    printHours: toPositiveNumber(getValue('editPrintHours'), Number(oldOrder.printHours || 0)),
    manualMinutes: toPositiveNumber(getValue('editManualMinutes'), Number(oldOrder.manualMinutes || 0)),
    notes: getTrimmedValue('editNotes'),

    materialCost: Number(oldOrder.materialCost || 0),
    wasteWeight: Number(oldOrder.wasteWeight || 0),
    wasteCost: Number(oldOrder.wasteCost || 0),
    depreciationCost: Number(oldOrder.depreciationCost || 0),
    electricityCost: Number(oldOrder.electricityCost || 0),
    laborCost: Number(oldOrder.laborCost || 0),
    packagingCost: Number(oldOrder.packagingCost || 0),
    shippingCost: Number(oldOrder.shippingCost || 0),
    riskCost: Number(oldOrder.riskCost || 0),
    taxCost: Number(oldOrder.taxCost || 0),
    totalCost,
    priceBeforeDiscount: Number(oldOrder.priceBeforeDiscount || oldOrder.finalPrice || 0),
    discountValue: Number(oldOrder.discountValue || 0),
    priceAfterDiscount: Number(oldOrder.priceAfterDiscount || oldOrder.finalPrice || 0),
    minimumOrderPrice: Number(oldOrder.minimumOrderPrice || 0),
    roundedAdjustment: Number(oldOrder.roundedAdjustment || 0),
    finalPrice,
    profit: finalPrice - totalCost - shippingCost,
    paymentStatus: paymentSnapshot.paymentStatus,
    paymentMethod: paymentSnapshot.paymentMethod,
    paidAmount: paymentSnapshot.paidAmount
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
}

async function deleteSale(code) {
  const confirmed = await askConfirm(`هل تريد حذف الأوردر ${code}؟ سيتم استرجاع الخامات للمخزون.`);

  if (!confirmed) return;

  const response = await window.farmAPI.deleteOrder(code);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الأوردر', 'error');
    return;
  }

  showToast('تم حذف الأوردر واسترجاع المخزون');
  await loadDashboardData();

  if (isModalOpen('reportsModal')) renderReportsTable();
  if (isModalOpen('pipelineModal')) renderPipeline();
}
