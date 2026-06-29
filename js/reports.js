function getFilteredOrders() {
  const search = getTrimmedValue('salesSearch').toLowerCase();
  const from = getValue('filterFrom');
  const to = getValue('filterTo');
  const filterPrinter = getValue('filterPrinter');
  const filterCustomer = getTrimmedValue('filterCustomer').toLowerCase();

  return getSortedOrders().filter((order) => {
    const code = String(order.code || '').toLowerCase();
    const itemName = String(order.itemName || '').toLowerCase();
    const customerName = String(order.customerName || '').toLowerCase();
    const notes = String(order.notes || '').toLowerCase();
    const printerId = String(order.printerId || '');

    const matchesSearch =
      !search ||
      code.includes(search) ||
      itemName.includes(search) ||
      customerName.includes(search) ||
      notes.includes(search);

    const matchesFrom = !from || (order.date && order.date >= from);
    const matchesTo = !to || (order.date && order.date <= to);
    const matchesPrinter = !filterPrinter || printerId === String(filterPrinter);
    const matchesCustomer = !filterCustomer || customerName.includes(filterCustomer);

    return matchesSearch && matchesFrom && matchesTo && matchesPrinter && matchesCustomer;
  });
}

function renderReportsTable() {
  const salesTableBody = $('salesTableBody');
  if (!salesTableBody) return;

  const allOrders = getFilteredOrders();
  const visibleOrders = allOrders.slice(0, reportsVisibleCount);

  let totalRevenue = 0;
  let totalProfit = 0;
  let topSale = 0;
  let cancelledCount = 0;
  const customerMap = new Map();

  allOrders.forEach((order) => {
    if (!isCancelled(order)) {
      totalRevenue += Number(order.finalPrice || 0);
      totalProfit += Number(order.profit || 0);
      topSale = Math.max(topSale, Number(order.finalPrice || 0));

      const customer = String(order.customerName || '').trim();
      if (customer) {
        customerMap.set(customer, (customerMap.get(customer) || 0) + Number(order.finalPrice || 0));
      }
    }

    if (String(order.status || '') === 'cancelled') cancelledCount += 1;
  });

  const rowsHtml = visibleOrders.map((order) => {
    const safeCode = escapeHtml(order.code || '');

    return `
      <tr>
        <td>${safeCode}</td>
        <td>${escapeHtml(order.date || '')}</td>
        <td>${escapeHtml(order.itemName || '')}</td>
        <td>${escapeHtml(order.customerName || '')}</td>
        <td>${escapeHtml(order.printerName || '-')}</td>
        <td>${formatNumber(order.quantity || 1)}</td>
        <td>${formatMoney(order.totalCost || 0)}</td>
        <td>${formatMoney(order.finalPrice || 0)}</td>
        <td>${formatMoney(order.profit || 0)}</td>
        <td>
          <button class="action-btn edit" type="button" onclick="openEditSale('${safeCode}')">تعديل</button>
          <button class="action-btn" type="button" onclick="openInvoice('${safeCode}')">فاتورة</button>
          <button class="action-btn delete" type="button" onclick="deleteSale('${safeCode}')">حذف</button>
        </td>
      </tr>
    `;
  }).join('');

  const moreRow = allOrders.length > visibleOrders.length
    ? `<tr><td colspan="10"><button class="btn btn-secondary btn-small" type="button" onclick="showMoreReports()">عرض المزيد (${allOrders.length - visibleOrders.length})</button></td></tr>`
    : '';

  salesTableBody.innerHTML = allOrders.length
    ? rowsHtml + moreRow
    : `<tr><td colspan="10"><div class="empty-state">لا توجد نتائج مطابقة.</div></td></tr>`;

  const validOrders = allOrders.filter((order) => !isCancelled(order));
  const avgProfit = validOrders.length ? totalProfit / validOrders.length : 0;

  const topCustomer = [...customerMap.entries()].sort((a, b) => b[1] - a[1])[0];

  const lowestStockMaterial = [...dashboardData.materials]
    .sort((a, b) => Number(a.remaining || 0) - Number(b.remaining || 0))[0];

  setText('statRev', formatMoney(totalRevenue));
  setText('statProfit', formatMoney(totalProfit));
  setText('statCount', String(allOrders.length));
  setText('statTop', formatMoney(topSale));
  setText('statAvgProfit', formatMoney(avgProfit));
  setText('statTopCustomer', topCustomer ? `${topCustomer[0]} (${formatMoney(topCustomer[1])})` : '-');
  setText(
    'statLowestStock',
    lowestStockMaterial
      ? `${lowestStockMaterial.name} (${toPositiveNumber(lowestStockMaterial.remaining, 0).toFixed(0)}g)`
      : '-'
  );
}

function showMoreReports() {
  reportsVisibleCount += LIST_PAGE_SIZE;
  renderReportsTable();
}

function renderReportsTableSafe() {
  if (isModalOpen('reportsModal')) renderReportsTable();
}

function openReports() {
  reportsVisibleCount = LIST_PAGE_SIZE;
  setActiveNav('reports');
  closeMainPanels();
  renderPrinterSelects();
  renderReportsTable();
  openModal('reportsModal');
}

function closeReports() {
  closeModal('reportsModal');
  returnToOrderNav();
}
