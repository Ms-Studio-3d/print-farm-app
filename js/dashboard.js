function getSortedOrders() {
  return [...dashboardData.orders].sort((a, b) => {
    return String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0);
  });
}

function getCustomersSummary() {
  const map = new Map();

  dashboardData.orders.forEach((order) => {
    const name = String(order.customerName || '').trim();
    if (!name) return;

    if (!map.has(name)) {
      map.set(name, {
        name,
        count: 0,
        revenue: 0,
        profit: 0,
        lastOrderCode: '',
        lastOrderDate: '',
        lastOrderItem: ''
      });
    }

    const entry = map.get(name);
    entry.count += 1;

    if (!isCancelled(order)) {
      entry.revenue += Number(order.finalPrice || 0);
      entry.profit += Number(order.profit || 0);
    }

    const orderDate = String(order.date || '');
    if (!entry.lastOrderDate || orderDate >= entry.lastOrderDate) {
      entry.lastOrderDate = orderDate;
      entry.lastOrderCode = order.code || '';
      entry.lastOrderItem = order.itemName || '';
    }
  });

  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.count - a.count);
}

function updateCustomersDatalist() {
  const datalist = $('customersDatalist');
  if (!datalist) return;

  datalist.innerHTML = getCustomersSummary()
    .map((customer) => `<option value="${escapeHtml(customer.name)}"></option>`)
    .join('');
}

function updateTopTitle() {
  const appTitle = document.querySelector('.app-title');
  const farmName = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;

  if (appTitle) appTitle.innerText = farmName;
  document.title = farmName;
}

function applyConfigToInputs() {
  const defaultProfitMargin = String(toPositiveNumber(dashboardData.config.defaultProfitMargin, DEFAULT_CONFIG.defaultProfitMargin));
  const defaultManualMinutes = String(toPositiveNumber(dashboardData.config.defaultManualMinutes, DEFAULT_CONFIG.defaultManualMinutes));
  const laborRate = String(toPositiveNumber(dashboardData.config.laborRate, DEFAULT_CONFIG.laborRate));
  const electricityCostPerHour = String(toPositiveNumber(dashboardData.config.electricityCostPerHour, DEFAULT_CONFIG.electricityCostPerHour));
  const packagingCost = String(toPositiveNumber(dashboardData.config.packagingCost, DEFAULT_CONFIG.packagingCost));
  const failurePercent = String(toPositiveNumber(dashboardData.config.failurePercent, DEFAULT_CONFIG.failurePercent));
  const defaultWasteWeight = String(toPositiveNumber(dashboardData.config.defaultWasteWeight, DEFAULT_CONFIG.defaultWasteWeight));
  const minimumOrderPrice = String(toPositiveNumber(dashboardData.config.minimumOrderPrice, DEFAULT_CONFIG.minimumOrderPrice));
  const shippingCost = String(toPositiveNumber(dashboardData.config.shippingCost, DEFAULT_CONFIG.shippingCost));
  const defaultTax = String(toPositiveNumber(dashboardData.config.defaultTaxPercent, DEFAULT_CONFIG.defaultTaxPercent));
  const defaultDiscount = String(toPositiveNumber(dashboardData.config.defaultDiscountValue, DEFAULT_CONFIG.defaultDiscountValue));
  const roundingStep = String(toPositiveNumber(dashboardData.config.roundingStep, DEFAULT_CONFIG.roundingStep));
  const currencyName = getCurrency();

  setValue('farmName', dashboardData.config.farmName || DEFAULT_CONFIG.farmName);
  setValue('currencyName', currencyName);

  setValue('profitMargin', defaultProfitMargin);
  setValue('manualMins', defaultManualMinutes);
  setValue('discountValue', defaultDiscount);

  setValue('laborRate', laborRate);
  setValue('electricityCostPerHour', electricityCostPerHour);
  setValue('packagingCost', packagingCost);
  setValue('failurePercent', failurePercent);
  setValue('wasteWeight', defaultWasteWeight);
  setValue('minimumOrderPrice', minimumOrderPrice);
  setValue('shippingCost', shippingCost);
  setValue('defaultTaxPercent', defaultTax);

  setValue('settingsDefaultProfitMargin', defaultProfitMargin);
  setValue('settingsDefaultManualMinutes', defaultManualMinutes);
  setValue('settingsLaborRate', laborRate);
  setValue('settingsElectricityCostPerHour', electricityCostPerHour);
  setValue('settingsPackagingCost', packagingCost);
  setValue('settingsFailurePercent', failurePercent);
  setValue('settingsDefaultWasteWeight', defaultWasteWeight);
  setValue('settingsMinimumOrderPrice', minimumOrderPrice);
  setValue('settingsShippingCost', shippingCost);
  setValue('settingsDefaultTaxPercent', defaultTax);
  setValue('settingsDefaultDiscountValue', defaultDiscount);
  setValue('settingsRoundingStep', roundingStep);
}

async function setNextOrderCode() {
  const response = await window.farmAPI.getNextOrderCode();
  if (!response?.success) return;

  const nextCode = String(response.data || 'ORD-1001');
  setText('nextOrderCode', nextCode.replace('ORD-', ''));
}

async function loadDashboardData() {
  const response = await window.farmAPI.getDashboardData();

  if (!response?.success) {
    showToast(response?.message || 'فشل في تحميل البيانات', 'error');
    return;
  }

  dashboardData = {
    config: { ...DEFAULT_CONFIG, ...(response.data?.config || {}) },
    printers: Array.isArray(response.data?.printers) ? response.data.printers : [],
    materials: Array.isArray(response.data?.materials) ? response.data.materials : [],
    orders: Array.isArray(response.data?.orders) ? response.data.orders : [],
    stockMovements: Array.isArray(response.data?.stockMovements) ? response.data.stockMovements : []
  };

  if (String(dashboardData.config.currencyName || '').trim() === 'ج') {
    dashboardData.config.currencyName = 'جنيه';
  }

  applyConfigToInputs();
  updateTopTitle();
  updateCustomersDatalist();
  renderPrinters();
  renderPrinterSelects();
  renderInventory();
  renderMaterialUsageInputs();
  renderReportsTableSafe();
  renderStockMovementsTableSafe();

  if (isModalOpen('pipelineModal')) renderPipeline();
  if (isModalOpen('customersModal')) renderCustomers();

  await setNextOrderCode();
  calc();
}
