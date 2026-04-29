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
      order.notes
    ].join(' ').toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesPrinter = !printerId || String(order.printerId || '') === String(printerId);
    const matchesFrom = !from || (order.date && order.date >= from);
    const matchesTo = !to || (order.date && order.date <= to);

    return matchesSearch && matchesPrinter && matchesFrom && matchesTo;
  });
}

function renderPipeline() {
  const targetMap = {
    new: $('pipelineNew'),
    printing: $('pipelinePrinting'),
    finished: $('pipelineFinished'),
    delivered: $('pipelineDelivered'),
    cancelled: $('pipelineCancelled')
  };

  const countMap = {
    new: $('pipelineCountNew'),
    printing: $('pipelineCountPrinting'),
    finished: $('pipelineCountFinished'),
    delivered: $('pipelineCountDelivered'),
    cancelled: $('pipelineCountCancelled')
  };

  Object.values(targetMap).forEach((el) => {
    if (el) el.innerHTML = '';
  });

  Object.values(countMap).forEach((el) => {
    if (el) el.innerText = '0';
  });

  const grouped = {
    new: [],
    printing: [],
    finished: [],
    delivered: [],
    cancelled: []
  };

  getPipelineFilteredOrders().forEach((order) => {
    const status = grouped[order.status] ? order.status : 'new';
    grouped[status].push(order);
  });

  Object.entries(grouped).forEach(([status, orders]) => {
    if (countMap[status]) countMap[status].innerText = String(orders.length);

    if (!targetMap[status]) return;

    targetMap[status].innerHTML = orders.length
      ? orders.map((order) => renderPipelineCard(order)).join('')
      : `<div class="empty-state">لا يوجد أوردرات</div>`;
  });
}

function renderPipelineCard(order) {
  const statusClass = getOrderStatusClass(order.status);
  const code = escapeHtml(order.code || '');

  const steps = ORDER_STATUS_FLOW
    .filter((status) => status !== order.status)
    .map((status) => {
      return `<button class="status-step-btn" type="button" onclick="updateOrderStatusQuick('${code}', '${status}')">${escapeHtml(getOrderStatusText(status))}</button>`;
    })
    .join('');

  return `
    <article class="pipeline-card">
      <div class="pipeline-card-head">
        <div>
          <span class="pipeline-code">${code}</span>
          <strong class="pipeline-title">${escapeHtml(order.itemName || '-')}</strong>
        </div>
        <span class="status-chip ${statusClass}">${escapeHtml(getOrderStatusText(order.status))}</span>
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

      <div class="status-step-row">${steps}</div>

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
    profit: Number(order.profit || 0)
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
