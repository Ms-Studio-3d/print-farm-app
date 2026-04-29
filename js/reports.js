function getFilteredOrders() {
  const search = getTrimmedValue('salesSearch').toLowerCase();
  const from = getValue('filterFrom');
  const to = getValue('filterTo');
  const filterStatus = getValue('filterStatus');
  const filterPrinter = getValue('filterPrinter');
  const filterCustomer = getTrimmedValue('filterCustomer').toLowerCase();

  return getSortedOrders().filter((order) => {
    const code = String(order.code || '').toLowerCase();
    const itemName = String(order.itemName || '').toLowerCase();
    const customerName = String(order.customerName || '').toLowerCase();
    const notes = String(order.notes || '').toLowerCase();
    const status = String(order.status || '');
    const printerId = String(order.printerId || '');

    const matchesSearch =
      !search ||
      code.includes(search) ||
      itemName.includes(search) ||
      customerName.includes(search) ||
      notes.includes(search);

    const matchesFrom = !from || (order.date && order.date >= from);
    const matchesTo = !to || (order.date && order.date <= to);
    const matchesStatus = !filterStatus || status === filterStatus;
    const matchesPrinter = !filterPrinter || printerId === String(filterPrinter);
    const matchesCustomer = !filterCustomer || customerName.includes(filterCustomer);

    return matchesSearch && matchesFrom && matchesTo && matchesStatus && matchesPrinter && matchesCustomer;
  });
}

function renderReportsTable() {
  const salesTableBody = $('salesTableBody');
  if (!salesTableBody) return;

  const orders = getFilteredOrders();

  let totalRevenue = 0;
  let totalProfit = 0;
  let topSale = 0;
  let cancelledCount = 0;
  const customerMap = new Map();

  const rowsHtml = orders.map((order) => {
    if (!isCancelled(order)) {
      totalRevenue += Number(order.finalPrice || 0);
      totalProfit += Number(order.profit || 0);
      topSale = Math.max(topSale, Number(order.finalPrice || 0));

      const customer = String(order.customerName || '').trim();
      if (customer) {
        customerMap.set(customer, (customerMap.get(customer) || 0) + Number(order.finalPrice || 0));
      }
    }

    if (String(order.status || '') === 'cancelled') {
      cancelledCount += 1;
    }

    const statusClass = getOrderStatusClass(order.status);

    return `
      <tr>
        <td>${escapeHtml(order.code)}</td>
        <td>${escapeHtml(order.date || '')}</td>
        <td>${escapeHtml(order.itemName || '')}</td>
        <td>${escapeHtml(order.customerName || '')}</td>
        <td>${escapeHtml(order.printerName || '-')}</td>
        <td><span class="status-chip ${statusClass}">${escapeHtml(getOrderStatusText(order.status))}</span></td>
        <td>${formatMoney(order.totalCost || 0)}</td>
        <td>${formatMoney(order.finalPrice || 0)}</td>
        <td>${formatMoney(order.profit || 0)}</td>
        <td>
          <button class="action-btn edit" type="button" onclick="openEditSale('${escapeHtml(order.code)}')">تعديل</button>
          <button class="action-btn" type="button" onclick="openInvoice('${escapeHtml(order.code)}')">فاتورة</button>
          <button class="action-btn delete" type="button" onclick="deleteSale('${escapeHtml(order.code)}')">حذف</button>
        </td>
      </tr>
    `;
  }).join('');

  salesTableBody.innerHTML = orders.length
    ? rowsHtml
    : `<tr><td colspan="10"><div class="empty-state">لا توجد نتائج مطابقة.</div></td></tr>`;

  const validOrders = orders.filter((order) => !isCancelled(order));
  const avgProfit = validOrders.length ? totalProfit / validOrders.length : 0;

  const topCustomer = [...customerMap.entries()].sort((a, b) => b[1] - a[1])[0];

  const lowestStockMaterial = [...dashboardData.materials]
    .sort((a, b) => Number(a.remaining || 0) - Number(b.remaining || 0))[0];

  setText('statRev', formatMoney(totalRevenue));
  setText('statProfit', formatMoney(totalProfit));
  setText('statCount', String(orders.length));
  setText('statTop', formatMoney(topSale));
  setText('statAvgProfit', formatMoney(avgProfit));
  setText('statCancelled', String(cancelledCount));
  setText('statTopCustomer', topCustomer ? `${topCustomer[0]} (${formatMoney(topCustomer[1])})` : '-');
  setText(
    'statLowestStock',
    lowestStockMaterial
      ? `${lowestStockMaterial.name} (${toPositiveNumber(lowestStockMaterial.remaining, 0).toFixed(0)}g)`
      : '-'
  );
}

function renderReportsTableSafe() {
  if (isModalOpen('reportsModal')) renderReportsTable();
}

function openReports() {
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
