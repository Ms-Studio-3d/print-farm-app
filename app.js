let dashboardData = {
  config: {},
  printers: [],
  materials: [],
  orders: [],
  stockMovements: []
};

let currentCalc = createEmptyCalc();
let editingOrderCode = null;
let currentInvoiceOrderCode = null;

const DEFAULT_CONFIG = {
  farmName: '3D Print Farm App',
  currencyName: 'جنيه',
  defaultProfitMargin: 100,
  defaultManualMinutes: 15,
  laborRate: 50,
  electricityCostPerHour: 3,
  packagingCost: 10,
  failurePercent: 10,
  defaultWasteWeight: 0,
  minimumOrderPrice: 0,
  shippingCost: 0,
  defaultTaxPercent: 0,
  defaultDiscountValue: 0,
  roundingStep: 5
};

const ORDER_STATUS_FLOW = ['new', 'printing', 'finished', 'delivered', 'cancelled'];

const MAIN_PANEL_IDS = [
  'reportsModal',
  'materialsManagerModal',
  'printersManagerModal',
  'customersModal',
  'pipelineModal',
  'settingsModal'
];

const MODAL_IDS = [
  'reportsModal',
  'editModal',
  'invoiceModal',
  'materialsManagerModal',
  'printersManagerModal',
  'printerModal',
  'materialModal',
  'stockMovementsModal',
  'customersModal',
  'pipelineModal',
  'settingsModal'
];

function createEmptyCalc() {
  return {
    materialCost: 0,
    wasteWeight: 0,
    wasteCost: 0,
    depreciationCost: 0,
    electricityCost: 0,
    laborCost: 0,
    packagingCost: 0,
    shippingCost: 0,
    riskCost: 0,
    taxCost: 0,
    totalCost: 0,
    priceBeforeDiscount: 0,
    discountValue: 0,
    priceAfterDiscount: 0,
    minimumOrderPrice: 0,
    roundedAdjustment: 0,
    finalPrice: 0,
    profit: 0,
    materialUsage: []
  };
}

function $(id) {
  return document.getElementById(id);
}

function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٫]/g, '.')
    .replace(/[٬]/g, '')
    .replace(/,/g, '.')
    .trim();
}

function toNumber(value, fallback = 0) {
  const normalized = normalizeDigits(value);
  if (normalized === '') return fallback;

  const num = Number(normalized);
  return Number.isFinite(num) ? num : fallback;
}

function toPositiveNumber(value, fallback = 0) {
  const num = toNumber(value, fallback);
  return num >= 0 ? num : fallback;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function roundUpToNearest5(value) {
  const safeValue = Math.max(0, Number(value || 0));
  const step = Math.max(1, toPositiveNumber(dashboardData.config.roundingStep, DEFAULT_CONFIG.roundingStep));
  return Math.ceil(safeValue / step) * step;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCurrency() {
  const rawCurrency = String(dashboardData.config.currencyName || DEFAULT_CONFIG.currencyName || 'جنيه').trim();

  if (!rawCurrency || rawCurrency === 'ج') {
    return 'جنيه';
  }

  return rawCurrency;
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ${getCurrency()}`;
}

function formatNumber(value) {
  return Number(value || 0).toFixed(2);
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.innerText = value;
}

function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value;
}

function getValue(id, fallback = '') {
  return String($(id)?.value ?? fallback);
}

function getTrimmedValue(id, fallback = '') {
  return getValue(id, fallback).trim();
}

function getConfigNumber(key) {
  return toPositiveNumber(dashboardData.config[key], toPositiveNumber(DEFAULT_CONFIG[key], 0));
}

function getPrinterById(id) {
  return dashboardData.printers.find((printer) => String(printer.id) === String(id));
}

function getMaterialById(id) {
  return dashboardData.materials.find((material) => String(material.id) === String(id));
}

function getOrderByCode(code) {
  return dashboardData.orders.find((item) => String(item.code) === String(code));
}

function isCancelled(order) {
  return String(order?.status || '') === 'cancelled';
}

function getPrinterStatusText(status) {
  switch (status) {
    case 'idle':
      return 'متاحة';
    case 'printing':
      return 'تطبع الآن';
    case 'maintenance':
      return 'صيانة';
    case 'offline':
      return 'متوقفة';
    default:
      return 'غير محدد';
  }
}

function getPrinterStatusClass(status) {
  switch (status) {
    case 'idle':
      return 'status-success';
    case 'printing':
      return 'status-warning';
    case 'maintenance':
    case 'offline':
      return 'status-danger';
    default:
      return '';
  }
}

function getOrderStatusText(status) {
  switch (status) {
    case 'new':
      return 'جديد';
    case 'printing':
      return 'قيد الطباعة';
    case 'finished':
      return 'جاهز';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغي';
    default:
      return 'غير محدد';
  }
}

function getOrderStatusClass(status) {
  switch (status) {
    case 'delivered':
    case 'finished':
      return 'status-success';
    case 'new':
    case 'printing':
      return 'status-warning';
    case 'cancelled':
      return 'status-danger';
    default:
      return '';
  }
}

function getMovementTypeText(type) {
  switch (type) {
    case 'in':
      return 'إضافة';
    case 'out':
      return 'خصم';
    case 'return':
      return 'استرجاع';
    case 'adjust_in':
      return 'زيادة يدوية';
    case 'adjust_out':
      return 'نقص يدوي';
    default:
      return type || '-';
  }
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('nav-btn-active', button.dataset.view === view);
  });
}

function getOpenModalsCount() {
  return MODAL_IDS.filter((modalId) => isModalOpen(modalId)).length;
}

function openModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.style.display = 'flex';
  modal.style.zIndex = String(10000 + getOpenModalsCount());
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.style.display = 'none';
  modal.style.zIndex = '';
  modal.setAttribute('aria-hidden', 'true');
}

function isModalOpen(id) {
  const modal = $(id);
  return !!modal && modal.style.display === 'flex';
}

function closeMainPanels() {
  MAIN_PANEL_IDS.forEach((id) => closeModal(id));
}

function closeAllModals() {
  MODAL_IDS.forEach((id) => closeModal(id));
}

function closeAllPanels() {
  closeAllModals();
  setActiveNav('order');
}

function returnToOrderNav() {
  const anyOpen = MODAL_IDS.some((id) => isModalOpen(id));
  if (!anyOpen) setActiveNav('order');
}

function showToast(message, type = 'success') {
  const oldToast = $('toastMsg');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'toastMsg';
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
  }, 2200);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 2600);
}

async function askConfirm(message) {
  try {
    const response = await window.farmAPI.confirm(message);
    return !!response?.success && !!response?.confirmed;
  } catch {
    return false;
  }
}

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

function renderPrinterSelects() {
  ['selectedPrinter', 'editPrinter', 'filterPrinter', 'pipelinePrinterFilter'].forEach((id) => {
    const select = $(id);
    if (!select) return;

    const oldValue = select.value;
    const firstOption = (id === 'filterPrinter' || id === 'pipelinePrinterFilter')
      ? `<option value="">كل الطابعات</option>`
      : `<option value="">اختر طابعة</option>`;

    select.innerHTML = [
      firstOption,
      ...dashboardData.printers.map(
        (printer) => `<option value="${Number(printer.id)}">${escapeHtml(printer.name)}</option>`
      )
    ].join('');

    if ([...select.options].some((opt) => opt.value === oldValue)) {
      select.value = oldValue;
    }
  });
}

function renderPrinters() {
  const printersList = $('printersList');
  if (!printersList) return;

  setText('printersCount', String(dashboardData.printers.length));
  setText('activePrintersCount', String(dashboardData.printers.filter((printer) => printer.status === 'printing').length));

  if (!dashboardData.printers.length) {
    printersList.innerHTML = `<div class="empty-state">لا توجد طابعات مضافة.</div>`;
    return;
  }

  printersList.innerHTML = dashboardData.printers.map((printer) => {
    const printerId = Number(printer.id);
    const statusText = getPrinterStatusText(printer.status);
    const statusClass = getPrinterStatusClass(printer.status);

    return `
      <div class="list-card">
        <div class="list-card-head">
          <strong>${escapeHtml(printer.name)}</strong>
          <span class="section-badge ${statusClass}">${escapeHtml(statusText)}</span>
        </div>

        <div class="list-card-body">
          <div>الموديل: ${escapeHtml(printer.model || '-')}</div>
          <div>تكلفة الماكينة / ساعة: ${formatMoney(printer.hourlyDepreciation || 0)}</div>
          <div>ملاحظات: ${escapeHtml(printer.notes || '-')}</div>
        </div>

        <div class="inline-actions card-actions">
          <button class="btn btn-secondary" type="button" onclick="editPrinter(${printerId})">تعديل</button>
          <button class="btn btn-danger" type="button" onclick="deletePrinterAction(${printerId})">حذف</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderInventory() {
  const inventoryUI = $('inventoryUI');
  if (!inventoryUI) return;

  setText('materialsCount', String(dashboardData.materials.length));

  const lowMaterials = dashboardData.materials.filter((material) => {
    return Number(material.remaining || 0) <= Number(material.lowStockThreshold || 0);
  });

  setText('lowStockCount', String(lowMaterials.length));

  if (!dashboardData.materials.length) {
    inventoryUI.innerHTML = `<div class="empty-state">لا توجد خامات مضافة.</div>`;
    return;
  }

  inventoryUI.innerHTML = [...dashboardData.materials]
    .sort((a, b) => Number(a.remaining || 0) - Number(b.remaining || 0))
    .map((material) => {
      const materialId = Number(material.id);
      const weight = Math.max(Number(material.weight || 0), 1);
      const remaining = toPositiveNumber(material.remaining, 0);
      const percentage = Math.max(0, Math.min(100, (remaining / weight) * 100));
      const isLow = remaining <= Number(material.lowStockThreshold || 0);

      return `
        <div class="stock-item ${isLow ? 'low' : ''}">
          <div class="stock-header">
            <span>${escapeHtml(material.name)}</span>
            <span>${remaining.toFixed(0)}g / ${weight.toFixed(0)}g</span>
          </div>

          <div class="stock-bar">
            <div class="stock-progress" style="width:${percentage}%"></div>
          </div>

          <div class="list-card-body stock-details">
            <div>النوع: ${escapeHtml(material.type || '-')}</div>
            <div>اللون: ${escapeHtml(material.color || '-')}</div>
            <div>السعر: ${formatMoney(material.price || 0)}</div>
            <div>حد التنبيه: ${toPositiveNumber(material.lowStockThreshold, 0).toFixed(0)}g</div>
            <div>المورد: ${escapeHtml(material.supplier || '-')}</div>
          </div>

          <div class="inline-actions card-actions">
            <button class="btn btn-secondary" type="button" onclick="editMaterial(${materialId})">تعديل</button>
            <button class="btn btn-danger" type="button" onclick="deleteMaterialAction(${materialId})">حذف</button>
          </div>
        </div>
      `;
    }).join('');
}

function renderMaterialUsageInputs() {
  const amsInputs = $('amsInputs');
  if (!amsInputs) return;

  const previousValues = {};
  document.querySelectorAll('.ams-weight').forEach((input) => {
    previousValues[String(input.dataset.id)] = input.value;
  });

  if (!dashboardData.materials.length) {
    amsInputs.innerHTML = `<div class="empty-state">أضف خامة أولًا لكي يظهر إدخال الاستهلاك.</div>`;
    return;
  }

  amsInputs.innerHTML = dashboardData.materials.map((material) => {
    const materialId = Number(material.id);
    const remaining = toPositiveNumber(material.remaining, 0);
    const isLow = remaining <= Number(material.lowStockThreshold || 0);
    const meta = `${material.type || '-'} • ${material.color || '-'} • المتبقي ${remaining.toFixed(0)}g`;

    return `
      <div class="material-row ${isLow ? 'low' : ''}">
        <div class="material-row-name">
          <span class="material-row-title">${escapeHtml(material.name)}</span>
          <span class="material-row-meta">${escapeHtml(meta)}</span>
        </div>

        <input
          type="text"
          class="ams-weight"
          data-id="${materialId}"
          placeholder="جرام"
          inputmode="decimal"
        />
      </div>
    `;
  }).join('');

  document.querySelectorAll('.ams-weight').forEach((input) => {
    const oldValue = previousValues[String(input.dataset.id)];
