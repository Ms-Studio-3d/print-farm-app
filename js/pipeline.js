function getPipelineFilteredOrders() {
  const search = getTrimmedValue('pipelineSearch').toLowerCase();
  const printerId = getValue('pipelinePrinterFilter');
  const from = getValue('pipelineFrom');
  const to = getValue('pipelineTo');

  return getSortedOrders().filter((order) => {
    const haystack = [
      order.code,
      order.itemName,
      order.customerName,
      order.printerName,
      order.notes,
    ].join(' ').toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesPrinter = !printerId || String(order.printerId || '') === String(printerId);
    const matchesFrom = !from || (order.date && order.date >= from);
    const matchesTo = !to || (order.date && order.date <= to);

    return matchesSearch && matchesPrinter && matchesFrom && matchesTo;
  });
}

function renderPipeline() {
  const target = $('pipelineAll');
  const count = $('pipelineCountAll');
  if (!target) return;

  const orders = getPipelineFilteredOrders();
  if (count) count.innerText = String(orders.length);

  target.innerHTML = orders.length
    ? orders.map((order) => renderPipelineCard(order)).join('')
    : `<div class="empty-state">لا يوجد أوردرات</div>`;
}

function renderPipelineCard(order) {
  const code = escapeHtml(order.code || '');

  return `
    <article class="pipeline-card">
      <div class="pipeline-card-head">
        <div>
          <span class="pipeline-code">${code}</span>
          <strong class="pipeline-title">${escapeHtml(order.itemName || '-')}</strong>
        </div>
      </div>

      <div class="pipeline-meta">
        <div>العميل: ${escapeHtml(order.customerName || '-')}</div>
        <div>الطابعة: ${escapeHtml(order.printerName || '-')}</div>
        <div>التاريخ: ${escapeHtml(order.date || '-')}</div>
      </div>

      <div class="pipeline-price">
        <span>التكلفة: ${formatMoney(order.totalCost || 0)}</span>
        <strong>البيع: ${formatMoney(order.finalPrice || 0)}</strong>
        <span>الربح: ${formatMoney(order.profit || 0)}</span>
      </div>

      <div class="pipeline-actions">
        <button class="action-btn edit" type="button" onclick="openEditSale('${code}')">تعديل</button>
        <button class="action-btn" type="button" onclick="openInvoice('${code}')">فاتورة</button>
        <button class="action-btn delete" type="button" onclick="deleteSale('${code}')">حذف</button>
      </div>
    </article>
  `;
}

function openPipelineModal() {
  setActiveNav('pipeline');
  closeMainPanels();
  renderPrinterSelects();
  renderPipeline();
  openModal('pipelineModal');
}

function closePipelineModal() {
  closeModal('pipelineModal');
  returnToOrderNav();
}

async function updateOrderStatusQuick(code, status) {
  const order = getOrderByCode(code);
  if (!order) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  const payload = {
    code: order.code,
    date: order.date,
    status,
    itemName: order.itemName,
    customerName: order.customerName,
    printerId: order.printerId || null,
    printHours: Number(order.printHours || 0),
    manualMinutes: Number(order.manualMinutes || 0),
    notes: order.notes || '',
    materialCost: Number(order.materialCost || 0),
    wasteWeight: Number(order.wasteWeight || 0),
    wasteCost: Number(order.wasteCost || 0),
    depreciationCost: Number(order.depreciationCost || 0),
    electricityCost: Number(order.electricityCost || 0),
    laborCost: Number(order.laborCost || 0),
    packagingCost: Number(order.packagingCost || 0),
    shippingCost: Number(order.shippingCost || 0),
    riskCost: Number(order.riskCost || 0),
    taxCost: Number(order.taxCost || 0),
    totalCost: Number(order.totalCost || 0),
    priceBeforeDiscount: Number(order.priceBeforeDiscount || order.finalPrice || 0),
    discountValue: Number(order.discountValue || 0),
    priceAfterDiscount: Number(order.priceAfterDiscount || order.finalPrice || 0),
    minimumOrderPrice: Number(order.minimumOrderPrice || 0),
    roundedAdjustment: Number(order.roundedAdjustment || 0),
    finalPrice: Number(order.finalPrice || 0),
    profit: Number(order.profit || 0),
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    paymentMethod: normalizePaymentMethod(order.paymentMethod),
    paidAmount: getOrderPaidAmount(order)
  };

  const response = await window.farmAPI.updateOrder(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في تغيير حالة الأوردر', 'error');
    return;
  }

  showToast(`تم نقل الأوردر إلى: ${getOrderStatusText(status)}`);
  await loadDashboardData();
  renderPipeline();
}
