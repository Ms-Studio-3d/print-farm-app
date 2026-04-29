function renderCustomers() {
  const customersList = $('customersList');
  if (!customersList) return;

  const customers = getCustomersSummary();

  setText('customersCount', String(customers.length));

  if (!customers.length) {
    customersList.innerHTML = `<div class="empty-state">لا يوجد عملاء مسجلين حتى الآن.</div>`;
    return;
  }

  customersList.innerHTML = customers.map((customer) => {
    return `
      <div class="list-card">
        <div class="list-card-head">
          <strong>${escapeHtml(customer.name)}</strong>
          <span class="section-badge status-success">${customer.count} أوردر</span>
        </div>

        <div class="list-card-body">
          <div>إجمالي الإيراد: ${formatMoney(customer.revenue)}</div>
          <div>صافي الربح: ${formatMoney(customer.profit)}</div>
          <div>آخر أوردر: ${escapeHtml(customer.lastOrderCode || '-')} - ${escapeHtml(customer.lastOrderItem || '-')}</div>
          <div>آخر تاريخ: ${escapeHtml(customer.lastOrderDate || '-')}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openCustomersModal() {
  setActiveNav('customers');
  closeMainPanels();
  renderCustomers();
  openModal('customersModal');
}

function closeCustomersModal() {
  closeModal('customersModal');
  returnToOrderNav();
}
