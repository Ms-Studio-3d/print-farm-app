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

  const allOrders = getPipelineFilteredOrders();
  const visibleOrders = allOrders.slice(0, pipelineVisibleCount);
  if (count) count.innerText = String(allOrders.length);

  const moreButton = allOrders.length > visibleOrders.length
    ? `<div class="inline-actions"><button class="btn btn-secondary btn-small" type="button" onclick="showMorePipeline()">عرض المزيد (${allOrders.length - visibleOrders.length})</button></div>`
    : '';

  target.innerHTML = allOrders.length
    ? visibleOrders.map((order) => renderPipelineCard(order)).join('') + moreButton
    : `<div class="empty-state">لا يوجد أوردرات</div>`;
}

function showMorePipeline() {
  pipelineVisibleCount += LIST_PAGE_SIZE;
  renderPipeline();
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
        <div>عدد القطع: ${formatNumber(order.quantity || 1)}</div>
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
  pipelineVisibleCount = LIST_PAGE_SIZE;
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
