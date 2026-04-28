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
  farmName: 'Print Farm App',
  currencyName: 'جنيه',
  laborRate: 50,
  electricityCostPerHour: 3,
  packagingCost: 10,
  failurePercent: 10,
  shippingCost: 0,
  defaultTaxPercent: 0
};

const ORDER_STATUS_FLOW = ['new', 'printing', 'finished', 'delivered', 'cancelled'];

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
  return Math.ceil(safeValue / 5) * 5;
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

function openModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function isModalOpen(id) {
  const modal = $(id);
  return !!modal && modal.style.display === 'flex';
}

function closeAllModals() {
  MODAL_IDS.forEach((id) => closeModal(id));
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
  const defaultTax = String(toPositiveNumber(dashboardData.config.defaultTaxPercent, DEFAULT_CONFIG.defaultTaxPercent));
  const currencyName = getCurrency();

  setValue('farmName', dashboardData.config.farmName || DEFAULT_CONFIG.farmName);
  setValue('currencyName', currencyName);

  setValue('defaultTaxPercent', defaultTax);
  setValue('settingsDefaultTaxPercent', defaultTax);

  setValue('laborRate', String(toPositiveNumber(dashboardData.config.laborRate, DEFAULT_CONFIG.laborRate)));
  setValue('electricityCostPerHour', String(toPositiveNumber(dashboardData.config.electricityCostPerHour, DEFAULT_CONFIG.electricityCostPerHour)));
  setValue('packagingCost', String(toPositiveNumber(dashboardData.config.packagingCost, DEFAULT_CONFIG.packagingCost)));
  setValue('failurePercent', String(toPositiveNumber(dashboardData.config.failurePercent, DEFAULT_CONFIG.failurePercent)));
  setValue('shippingCost', String(toPositiveNumber(dashboardData.config.shippingCost, DEFAULT_CONFIG.shippingCost)));
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
    if (oldValue != null) input.value = oldValue;

    input.addEventListener('input', calc);
    input.addEventListener('change', calc);
  });
}

function getMaterialUsageFromInputs() {
  const usage = [];

  document.querySelectorAll('.ams-weight').forEach((input) => {
    const grams = toPositiveNumber(input.value, 0);
    const material = getMaterialById(String(input.dataset.id));

    if (!material || grams <= 0) return;

    const pricePerGram = Number(material.weight || 0) > 0
      ? Number(material.price || 0) / Number(material.weight || 0)
      : 0;

    usage.push({
      materialId: Number(material.id),
      materialName: material.name,
      grams: Number(grams.toFixed(2)),
      pricePerGram: Number(pricePerGram.toFixed(6)),
      totalCost: Number((grams * pricePerGram).toFixed(2)),
      remaining: Number(material.remaining || 0)
    });
  });

  return usage;
}

function calc() {
  const materialUsage = getMaterialUsageFromInputs();

  const printHours = toPositiveNumber(getValue('printHours'), 0);
  const manualMinutes = toPositiveNumber(getValue('manualMins'), 0);
  const profitMargin = toPositiveNumber(getValue('profitMargin'), 0);
  const discountValue = toPositiveNumber(getValue('discountValue'), 0);

  const packagingCost = toPositiveNumber(getValue('packagingCost'), getConfigNumber('packagingCost'));
  const shippingCost = toPositiveNumber(getValue('shippingCost'), getConfigNumber('shippingCost'));
  const laborRate = toPositiveNumber(getValue('laborRate'), getConfigNumber('laborRate'));
  const electricityCostPerHour = toPositiveNumber(getValue('electricityCostPerHour'), getConfigNumber('electricityCostPerHour'));
  const failurePercent = toPositiveNumber(getValue('failurePercent'), getConfigNumber('failurePercent'));
  const defaultTaxPercent = toPositiveNumber(getValue('defaultTaxPercent'), getConfigNumber('defaultTaxPercent'));

  const materialCost = materialUsage.reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);

  const selectedPrinterId = getValue('selectedPrinter');
  const printer = selectedPrinterId ? getPrinterById(selectedPrinterId) : null;
  const hourlyDepreciation = toPositiveNumber(printer?.hourlyDepreciation, 0);

  const depreciationCost = printHours * hourlyDepreciation;
  const electricityCost = printHours * electricityCostPerHour;
  const laborCost = (manualMinutes / 60) * laborRate;

  const baseCost =
    materialCost +
    depreciationCost +
    electricityCost +
    laborCost +
    packagingCost +
    shippingCost;

  const riskCost = baseCost * (failurePercent / 100);
  const costBeforeTax = baseCost + riskCost;
  const taxCost = costBeforeTax * (defaultTaxPercent / 100);
  const totalCost = costBeforeTax + taxCost;

  const priceBeforeDiscount = totalCost * (1 + (profitMargin / 100));
  const safeDiscountValue = Math.min(discountValue, priceBeforeDiscount);
  const priceAfterDiscount = Math.max(0, priceBeforeDiscount - safeDiscountValue);
  const finalPrice = roundUpToNearest5(priceAfterDiscount);
  const roundedAdjustment = finalPrice - priceAfterDiscount;
  const profit = finalPrice - totalCost;

  setText('resMat', formatMoney(materialCost));
  setText('resDep', formatMoney(depreciationCost));
  setText('resElectricity', formatMoney(electricityCost));
  setText('resLabor', formatMoney(laborCost));
  setText('resPackaging', formatMoney(packagingCost));
  setText('resShipping', formatMoney(shippingCost));
  setText('resRisk', formatMoney(riskCost));
  setText('resTax', formatMoney(taxCost));
  setText('resTotal', formatMoney(totalCost));
  setText('resBeforeDiscount', formatMoney(priceBeforeDiscount));
  setText('resDiscount', formatMoney(safeDiscountValue));
  setText('resRoundedAdjustment', formatMoney(roundedAdjustment));
  setText('resFinal', formatMoney(finalPrice));
  setText('resProfit', formatMoney(profit));

  currentCalc = {
    materialCost: roundMoney(materialCost),
    depreciationCost: roundMoney(depreciationCost),
    electricityCost: roundMoney(electricityCost),
    laborCost: roundMoney(laborCost),
    packagingCost: roundMoney(packagingCost),
    shippingCost: roundMoney(shippingCost),
    riskCost: roundMoney(riskCost),
    taxCost: roundMoney(taxCost),
    totalCost: roundMoney(totalCost),
    priceBeforeDiscount: roundMoney(priceBeforeDiscount),
    discountValue: roundMoney(safeDiscountValue),
    priceAfterDiscount: roundMoney(priceAfterDiscount),
    roundedAdjustment: roundMoney(roundedAdjustment),
    finalPrice: roundMoney(finalPrice),
    profit: roundMoney(profit),
    materialUsage
  };
}

function resetResultsPanel() {
  setText('resMat', formatMoney(0));
  setText('resDep', formatMoney(0));
  setText('resElectricity', formatMoney(0));
  setText('resLabor', formatMoney(0));
  setText('resPackaging', formatMoney(0));
  setText('resShipping', formatMoney(0));
  setText('resRisk', formatMoney(0));
  setText('resTax', formatMoney(0));
  setText('resTotal', formatMoney(0));
  setText('resBeforeDiscount', formatMoney(0));
  setText('resDiscount', formatMoney(0));
  setText('resRoundedAdjustment', formatMoney(0));
  setText('resFinal', formatMoney(0));
  setText('resProfit', formatMoney(0));
}

function resetOrderForm() {
  setValue('itemName', '');
  setValue('customerName', '');
  setValue('selectedPrinter', '');
  setValue('printHours', '0');
  setValue('manualMins', '15');
  setValue('opDate', new Date().toISOString().slice(0, 10));
  setValue('orderStatus', 'new');
  setValue('orderNotes', '');
  setValue('profitMargin', '100');
  setValue('discountValue', '0');

  document.querySelectorAll('.ams-weight').forEach((input) => {
    input.value = '';
  });

  applyConfigToInputs();
  currentCalc = createEmptyCalc();

  resetResultsPanel();
  setNextOrderCode();
  calc();
}

function validateOrderBeforeSave() {
  const itemName = getTrimmedValue('itemName');
  const printHours = toPositiveNumber(getValue('printHours'), 0);
  const printerId = getValue('selectedPrinter');
  const materialUsage = getMaterialUsageFromInputs();

  if (!itemName) {
    showToast('اسم المجسم مطلوب', 'error');
    $('itemName')?.focus();
    return { valid: false };
  }

  if (!printerId) {
    showToast('اختار الطابعة المستخدمة', 'error');
    $('selectedPrinter')?.focus();
    return { valid: false };
  }

  if (printHours <= 0) {
    showToast('وقت الطباعة لازم يكون أكبر من صفر', 'error');
    $('printHours')?.focus();
    return { valid: false };
  }

  if (!materialUsage.length) {
    showToast('أدخل استهلاك خامة واحدة على الأقل', 'error');
    return { valid: false };
  }

  for (const item of materialUsage) {
    if (Number(item.grams || 0) > Number(item.remaining || 0)) {
      showToast(`المخزون غير كافٍ في ${item.materialName}`, 'error');
      return { valid: false };
    }
  }

  if (Number(currentCalc.totalCost || 0) <= 0 || Number(currentCalc.finalPrice || 0) <= 0) {
    showToast('راجع بيانات التسعير أولًا', 'error');
    return { valid: false };
  }

  if (Number(currentCalc.finalPrice || 0) < Number(currentCalc.totalCost || 0)) {
    showToast('سعر البيع أقل من التكلفة', 'error');
    return { valid: false };
  }

  return {
    valid: true,
    itemName,
    printerId,
    materialUsage
  };
}

async function saveSale() {
  calc();

  const validation = validateOrderBeforeSave();
  if (!validation.valid) return;

  const responseCode = await window.farmAPI.getNextOrderCode();
  if (!responseCode?.success) {
    showToast(responseCode?.message || 'فشل في إنشاء كود الأوردر', 'error');
    return;
  }

  const responseOrderCode = String(responseCode.data || 'ORD-1001');

  const payload = {
    code: responseOrderCode,
    itemName: validation.itemName,
    customerName: getTrimmedValue('customerName'),
    printerId: Number(validation.printerId),
    status: getTrimmedValue('orderStatus', 'new'),
    printHours: toPositiveNumber(getValue('printHours'), 0),
    manualMinutes: toPositiveNumber(getValue('manualMins'), 0),
    notes: getTrimmedValue('orderNotes'),
    date: getValue('opDate') || new Date().toISOString().slice(0, 10),
    materialCost: currentCalc.materialCost,
    depreciationCost: currentCalc.depreciationCost,
    electricityCost: currentCalc.electricityCost,
    laborCost: currentCalc.laborCost,
    packagingCost: currentCalc.packagingCost,
    shippingCost: currentCalc.shippingCost,
    riskCost: currentCalc.riskCost,
    taxCost: currentCalc.taxCost,
    totalCost: currentCalc.totalCost,
    priceBeforeDiscount: currentCalc.priceBeforeDiscount,
    discountValue: currentCalc.discountValue,
    priceAfterDiscount: currentCalc.priceAfterDiscount,
    roundedAdjustment: currentCalc.roundedAdjustment,
    finalPrice: currentCalc.finalPrice,
    profit: currentCalc.profit,
    materialUsage: validation.materialUsage
  };

  const response = await window.farmAPI.createOrder(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حفظ الأوردر', 'error');
    return;
  }

  showToast('تم تسجيل الأوردر وخصم المخزون بنجاح');
  await loadDashboardData();
  resetOrderForm();
  setActiveNav('order');
}

/* Reports */
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
  renderPrinterSelects();
  renderReportsTable();
  openModal('reportsModal');
}

function closeReports() {
  closeModal('reportsModal');
  returnToOrderNav();
}

/* Pipeline */
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

/* Edit Order */
function openEditSale(code) {
  const order = getOrderByCode(code);
  if (!order) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  editingOrderCode = code;

  setValue('editCode', order.code || '');
  setValue('editDate', order.date || '');
  setValue('editStatus', order.status || 'new');
  setValue('editName', order.itemName || '');
  setValue('editCustomer', order.customerName || '');
  setValue('editPrinter', order.printerId ? String(order.printerId) : '');
  setValue('editNotes', order.notes || '');
  setValue('editCost', String(toPositiveNumber(order.totalCost, 0)));
  setValue('editPrice', String(toPositiveNumber(order.finalPrice, 0)));

  openModal('editModal');
}

function closeEditModal() {
  editingOrderCode = null;
  closeModal('editModal');
  returnToOrderNav();
}

async function saveEditedSale() {
  if (!editingOrderCode) {
    showToast('لا يوجد أوردر مفتوح للتعديل', 'error');
    return;
  }

  const oldOrder = getOrderByCode(editingOrderCode);

  if (!oldOrder) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  const payload = {
    code: editingOrderCode,
    date: getValue('editDate'),
    status: getTrimmedValue('editStatus', 'new'),
    itemName: getTrimmedValue('editName'),
    customerName: getTrimmedValue('editCustomer'),
    printerId: getValue('editPrinter') ? Number(getValue('editPrinter')) : null,
    printHours: Number(oldOrder.printHours || 0),
    manualMinutes: Number(oldOrder.manualMinutes || 0),
    notes: getTrimmedValue('editNotes'),
    materialCost: Number(oldOrder.materialCost || 0),
    depreciationCost: Number(oldOrder.depreciationCost || 0),
    electricityCost: Number(oldOrder.electricityCost || 0),
    laborCost: Number(oldOrder.laborCost || 0),
    packagingCost: Number(oldOrder.packagingCost || 0),
    shippingCost: Number(oldOrder.shippingCost || 0),
    riskCost: Number(oldOrder.riskCost || 0),
    taxCost: Number(oldOrder.taxCost || 0),
    totalCost: toPositiveNumber(getValue('editCost'), 0),
    priceBeforeDiscount: Number(oldOrder.priceBeforeDiscount || oldOrder.finalPrice || 0),
    discountValue: Number(oldOrder.discountValue || 0),
    priceAfterDiscount: Number(oldOrder.priceAfterDiscount || oldOrder.finalPrice || 0),
    roundedAdjustment: Number(oldOrder.roundedAdjustment || 0),
    finalPrice: toPositiveNumber(getValue('editPrice'), 0)
  };

  if (!payload.itemName) {
    showToast('اسم المجسم مطلوب', 'error');
    return;
  }

  payload.profit = Number((payload.finalPrice - payload.totalCost).toFixed(2));

  const response = await window.farmAPI.updateOrder(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في تعديل الأوردر', 'error');
    return;
  }

  closeEditModal();
  showToast('تم تعديل الأوردر بنجاح');
  await loadDashboardData();
}

async function deleteSale(code) {
  const confirmed = await askConfirm('هل تريد حذف الأوردر؟ سيتم استرجاع الخامات للمخزون.');
  if (!confirmed) return;

  const response = await window.farmAPI.deleteOrder(code);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الأوردر', 'error');
    return;
  }

  showToast('تم حذف الأوردر واسترجاع الخامات');
  await loadDashboardData();
}

/* Customers */
function renderCustomers() {
  const customersTableBody = $('customersTableBody');
  if (!customersTableBody) return;

  const search = getTrimmedValue('customersSearch').toLowerCase();
  const customers = getCustomersSummary().filter((customer) => {
    return !search || customer.name.toLowerCase().includes(search);
  });

  if (!customers.length) {
    customersTableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">لا يوجد عملاء مطابقين.</div></td></tr>`;
    return;
  }

  customersTableBody.innerHTML = customers.map((customer) => {
    return `
      <tr>
        <td>${escapeHtml(customer.name)}</td>
        <td>${customer.count}</td>
        <td>${formatMoney(customer.revenue)}</td>
        <td>${formatMoney(customer.profit)}</td>
        <td>${escapeHtml(customer.lastOrderCode || '-')} • ${escapeHtml(customer.lastOrderItem || '-')}</td>
        <td><button class="action-btn" type="button" onclick="filterReportsByCustomer('${escapeHtml(customer.name)}')">عرض الأوردرات</button></td>
      </tr>
    `;
  }).join('');
}

function openCustomersModal() {
  setActiveNav('customers');
  renderCustomers();
  openModal('customersModal');
}

function closeCustomersModal() {
  closeModal('customersModal');
  returnToOrderNav();
}

function filterReportsByCustomer(customerName) {
  closeCustomersModal();
  openReports();
  setValue('filterCustomer', customerName);
  renderReportsTable();
}

/* Invoice */
function openInvoice(code) {
  const order = getOrderByCode(code);
  if (!order) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  currentInvoiceOrderCode = code;
  renderInvoice(order);
  openModal('invoiceModal');
}

function openInvoiceForCurrentEdit() {
  const code = editingOrderCode || getTrimmedValue('editCode');
  if (!code) {
    showToast('لا يوجد أوردر مفتوح للفاتورة', 'error');
    return;
  }

  openInvoice(code);
}

function closeInvoiceModal() {
  currentInvoiceOrderCode = null;
  closeModal('invoiceModal');
  returnToOrderNav();
}

function renderInvoice(order) {
  const invoiceContent = $('invoiceContent');
  if (!invoiceContent) return;

  const farmName = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;

  invoiceContent.innerHTML = `
    <div class="invoice-header">
      <div class="invoice-brand">
        <h1>${escapeHtml(farmName)}</h1>
        <p>إيصال طلب طباعة ثلاثية الأبعاد</p>
        <span class="invoice-badge">${escapeHtml(getOrderStatusText(order.status))}</span>
      </div>

      <div class="invoice-meta">
        <p><strong>كود الأوردر:</strong> ${escapeHtml(order.code || '-')}</p>
        <p><strong>التاريخ:</strong> ${escapeHtml(order.date || '-')}</p>
        <p><strong>الطابعة:</strong> ${escapeHtml(order.printerName || '-')}</p>
      </div>
    </div>

    <div class="invoice-section">
      <h3>بيانات الطلب</h3>
      <div class="invoice-grid">
        <div class="invoice-box">
          <span>اسم العميل</span>
          <strong>${escapeHtml(order.customerName || '-')}</strong>
        </div>

        <div class="invoice-box">
          <span>اسم المجسم</span>
          <strong>${escapeHtml(order.itemName || '-')}</strong>
        </div>

        <div class="invoice-box">
          <span>إجمالي التكلفة</span>
          <strong>${formatMoney(order.totalCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الربح</span>
          <strong>${formatMoney(order.profit || 0)}</strong>
        </div>
      </div>
    </div>

    <div class="invoice-section">
      <h3>تفاصيل التكلفة</h3>
      <div class="invoice-grid">
        <div class="invoice-box">
          <span>الخامة</span>
          <strong>${formatMoney(order.materialCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>تكلفة الماكينة</span>
          <strong>${formatMoney(order.depreciationCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الكهرباء</span>
          <strong>${formatMoney(order.electricityCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الشغل اليدوي</span>
          <strong>${formatMoney(order.laborCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>التغليف</span>
          <strong>${formatMoney(order.packagingCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الشحن / المصاريف</span>
          <strong>${formatMoney(order.shippingCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الهالك</span>
          <strong>${formatMoney(order.riskCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الضريبة</span>
          <strong>${formatMoney(order.taxCost || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>السعر قبل الخصم</span>
          <strong>${formatMoney(order.priceBeforeDiscount || order.finalPrice || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>الخصم</span>
          <strong>${formatMoney(order.discountValue || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>السعر بعد الخصم</span>
          <strong>${formatMoney(order.priceAfterDiscount || order.finalPrice || 0)}</strong>
        </div>

        <div class="invoice-box">
          <span>فرق التقريب</span>
          <strong>${formatMoney(order.roundedAdjustment || 0)}</strong>
        </div>
      </div>
    </div>

    <div class="invoice-total">
      <div>
        <span>إجمالي المطلوب</span>
        <strong>${formatMoney(order.finalPrice || 0)}</strong>
      </div>
      <div>
        <span>شكرًا لاختيارك ${escapeHtml(farmName)}</span>
      </div>
    </div>

    <div class="invoice-notes">
      <strong>ملاحظات:</strong>
      <div>${escapeHtml(order.notes || 'لا توجد ملاحظات.')}</div>
    </div>
  `;
}

function printInvoice() {
  window.print();
}

/* Materials */
function openMaterialsManagerModal() {
  setActiveNav('materials');
  renderInventory();
  openModal('materialsManagerModal');
}

function closeMaterialsManagerModal() {
  closeModal('materialsManagerModal');
  returnToOrderNav();
}

function openMaterialModal() {
  setValue('materialId', '');
  setValue('materialName', '');
  setValue('materialType', 'PLA');
  setValue('materialColor', '');
  setValue('materialWeight', '1000');
  setValue('materialRemaining', '1000');
  setValue('materialPrice', '0');
  setValue('materialLowStock', '150');
  setValue('materialSupplier', '');

  openModal('materialModal');
}

function closeMaterialModal() {
  closeModal('materialModal');
}

function editMaterial(id) {
  const material = getMaterialById(id);
  if (!material) {
    showToast('الخامة غير موجودة', 'error');
    return;
  }

  setValue('materialId', material.id);
  setValue('materialName', material.name || '');
  setValue('materialType', material.type || '');
  setValue('materialColor', material.color || '');
  setValue('materialWeight', String(toPositiveNumber(material.weight, 1000)));
  setValue('materialRemaining', String(toPositiveNumber(material.remaining, 0)));
  setValue('materialPrice', String(toPositiveNumber(material.price, 0)));
  setValue('materialLowStock', String(toPositiveNumber(material.lowStockThreshold, 150)));
  setValue('materialSupplier', material.supplier || '');

  openModal('materialModal');
}

async function saveMaterial() {
  const payload = {
    id: getValue('materialId'),
    name: getTrimmedValue('materialName'),
    type: getTrimmedValue('materialType'),
    color: getTrimmedValue('materialColor'),
    weight: toPositiveNumber(getValue('materialWeight'), 0),
    remaining: toPositiveNumber(getValue('materialRemaining'), 0),
    price: toPositiveNumber(getValue('materialPrice'), 0),
    lowStockThreshold: toPositiveNumber(getValue('materialLowStock'), 0),
    supplier: getTrimmedValue('materialSupplier')
  };

  if (!payload.name) {
    showToast('اسم الخامة مطلوب', 'error');
    return;
  }

  if (payload.weight <= 0) {
    showToast('وزن الخامة لازم يكون أكبر من صفر', 'error');
    return;
  }

  if (payload.remaining > payload.weight) {
    showToast('المتبقي لا يمكن أن يكون أكبر من وزن البكرة', 'error');
    return;
  }

  const response = await window.farmAPI.saveMaterial(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حفظ الخامة', 'error');
    return;
  }

  closeMaterialModal();
  showToast('تم حفظ الخامة بنجاح');
  await loadDashboardData();
  openMaterialsManagerModal();
}

function getDeleteMaterialToastMessage(result) {
  if (result?.archived) return 'الخامة مستخدمة في أوردرات سابقة، لذلك تم أرشفتها بدل حذفها';
  if (result?.deleted) return 'تم حذف الخامة نهائيًا';
  return 'تم تنفيذ العملية';
}

async function deleteMaterialAction(id) {
  const confirmed = await askConfirm('هل تريد حذف الخامة؟ إذا كانت مستخدمة سابقًا فسيتم أرشفتها بدل حذفها.');
  if (!confirmed) return;

  const response = await window.farmAPI.deleteMaterial(id);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الخامة', 'error');
    return;
  }

  showToast(getDeleteMaterialToastMessage(response.data));
  await loadDashboardData();
  openMaterialsManagerModal();
}

/* Printers */
function openPrintersManagerModal() {
  setActiveNav('settings');
  renderPrinters();
  openModal('printersManagerModal');
}

function closePrintersManagerModal() {
  closeModal('printersManagerModal');
  returnToOrderNav();
}

function openPrinterModal() {
  setValue('printerId', '');
  setValue('printerName', '');
  setValue('printerStatus', 'idle');
  setValue('printerModel', 'Bambu Lab A1');
  setValue('printerHourlyDepreciation', '0');
  setValue('printerNotes', '');

  openModal('printerModal');
}

function closePrinterModal() {
  closeModal('printerModal');
}

function editPrinter(id) {
  const printer = getPrinterById(id);
  if (!printer) {
    showToast('الطابعة غير موجودة', 'error');
    return;
  }

  setValue('printerId', printer.id);
  setValue('printerName', printer.name || '');
  setValue('printerStatus', printer.status || 'idle');
  setValue('printerModel', printer.model || '');
  setValue('printerHourlyDepreciation', String(toPositiveNumber(printer.hourlyDepreciation, 0)));
  setValue('printerNotes', printer.notes || '');

  openModal('printerModal');
}

async function savePrinter() {
  const payload = {
    id: getValue('printerId'),
    name: getTrimmedValue('printerName'),
    status: getTrimmedValue('printerStatus', 'idle'),
    model: getTrimmedValue('printerModel'),
    hourlyDepreciation: toPositiveNumber(getValue('printerHourlyDepreciation'), 0),
    notes: getTrimmedValue('printerNotes')
  };

  if (!payload.name) {
    showToast('اسم الطابعة مطلوب', 'error');
    return;
  }

  const response = await window.farmAPI.savePrinter(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حفظ الطابعة', 'error');
    return;
  }

  closePrinterModal();
  showToast('تم حفظ الطابعة بنجاح');
  await loadDashboardData();
  openPrintersManagerModal();
}

function getDeletePrinterToastMessage(result) {
  if (result?.archived) return 'الطابعة مستخدمة في أوردرات سابقة، لذلك تم أرشفتها بدل حذفها';
  if (result?.deleted) return 'تم حذف الطابعة نهائيًا';
  return 'تم تنفيذ العملية';
}

async function deletePrinterAction(id) {
  const confirmed = await askConfirm('هل تريد حذف الطابعة؟ إذا كانت مستخدمة سابقًا فسيتم أرشفتها بدل حذفها.');
  if (!confirmed) return;

  const response = await window.farmAPI.deletePrinter(id);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الطابعة', 'error');
    return;
  }

  showToast(getDeletePrinterToastMessage(response.data));
  await loadDashboardData();
  openPrintersManagerModal();
}

/* Stock */
function renderStockMovementsTable() {
  const stockMovementsBody = $('stockMovementsBody');
  if (!stockMovementsBody) return;

  if (!dashboardData.stockMovements.length) {
    stockMovementsBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">لا توجد حركة مخزون.</div></td></tr>`;
    return;
  }

  stockMovementsBody.innerHTML = dashboardData.stockMovements.map((movement) => {
    return `
      <tr>
        <td>${escapeHtml(formatDateTime(movement.createdAt))}</td>
        <td>${escapeHtml(movement.materialName || '')}</td>
        <td>${escapeHtml(getMovementTypeText(movement.movementType))}</td>
        <td>${Number(movement.quantity || 0).toFixed(2)} g</td>
        <td>${escapeHtml(movement.reason || '')}</td>
        <td>${escapeHtml(movement.referenceCode || '-')}</td>
      </tr>
    `;
  }).join('');
}

function renderStockMovementsTableSafe() {
  if (isModalOpen('stockMovementsModal')) renderStockMovementsTable();
}

function openStockMovementsModal() {
  renderStockMovementsTable();
  openModal('stockMovementsModal');
}

function closeStockMovementsModal() {
  closeModal('stockMovementsModal');
  returnToOrderNav();
}

/* Settings */
function openSettingsModal() {
  setActiveNav('settings');
  applyConfigToInputs();
  openModal('settingsModal');
}

function closeSettingsModal() {
  closeModal('settingsModal');
  returnToOrderNav();
}

async function saveConfig() {
  const currencyName = getTrimmedValue('currencyName') || DEFAULT_CONFIG.currencyName;

  const payload = {
    farmName: getTrimmedValue('farmName') || DEFAULT_CONFIG.farmName,
    currencyName: currencyName === 'ج' ? 'جنيه' : currencyName,
    defaultTaxPercent: String(toPositiveNumber(getValue('settingsDefaultTaxPercent'), DEFAULT_CONFIG.defaultTaxPercent)),
    laborRate: String(toPositiveNumber(getValue('laborRate'), DEFAULT_CONFIG.laborRate)),
    electricityCostPerHour: String(toPositiveNumber(getValue('electricityCostPerHour'), DEFAULT_CONFIG.electricityCostPerHour)),
    packagingCost: String(toPositiveNumber(getValue('packagingCost'), DEFAULT_CONFIG.packagingCost)),
    failurePercent: String(toPositiveNumber(getValue('failurePercent'), DEFAULT_CONFIG.failurePercent)),
    shippingCost: String(toPositiveNumber(getValue('shippingCost'), DEFAULT_CONFIG.shippingCost))
  };

  const response = await window.farmAPI.saveConfig(payload);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حفظ الإعدادات', 'error');
    return;
  }

  showToast('تم حفظ الإعدادات');
  await loadDashboardData();
  closeSettingsModal();
}

/* Export / Import */
async function exportBackupJSON() {
  const response = await window.farmAPI.exportBackup();

  if (!response?.success) {
    showToast(response?.message || 'فشل في تصدير النسخة الاحتياطية', 'error');
    return;
  }

  downloadTextFile(
    `print-farm-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(response.data, null, 2),
    'application/json'
  );

  showToast('تم تصدير النسخة الاحتياطية');
}

function importBackupJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const confirmed = await askConfirm('استيراد النسخة الاحتياطية سيستبدل البيانات الحالية. هل تريد المتابعة؟');
      if (!confirmed) return;

      const parsed = JSON.parse(String(e.target?.result || '{}'));
      const response = await window.farmAPI.importBackup(parsed);

      if (!response?.success) {
        showToast(response?.message || 'فشل في استيراد النسخة الاحتياطية', 'error');
        return;
      }

      showToast('تم استيراد النسخة الاحتياطية بنجاح');
      await loadDashboardData();
      resetOrderForm();
      setActiveNav('order');
    } catch {
      showToast('ملف الاستيراد غير صالح', 'error');
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCSV(headers, rows) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(','))
  ].join('\n');
}

function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function exportSalesCSV() {
  const rows = getFilteredOrders().map((order) => [
    order.code,
    order.date,
    order.itemName,
    order.customerName,
    order.printerName,
    getOrderStatusText(order.status),
    formatNumber(order.materialCost),
    formatNumber(order.depreciationCost),
    formatNumber(order.electricityCost),
    formatNumber(order.laborCost),
    formatNumber(order.packagingCost),
    formatNumber(order.shippingCost),
    formatNumber(order.riskCost),
    formatNumber(order.taxCost),
    formatNumber(order.totalCost),
    formatNumber(order.priceBeforeDiscount),
    formatNumber(order.discountValue),
    formatNumber(order.priceAfterDiscount),
    formatNumber(order.roundedAdjustment),
    formatNumber(order.finalPrice),
    formatNumber(order.profit),
    order.notes
  ]);

  const csv = buildCSV(
    [
      'الكود',
      'التاريخ',
      'المجسم',
      'العميل',
      'الطابعة',
      'الحالة',
      'تكلفة الخامة',
      'تكلفة الماكينة',
      'الكهرباء',
      'الشغل اليدوي',
      'التغليف',
      'الشحن / المصاريف',
      'الهالك',
      'الضريبة',
      'إجمالي التكلفة',
      'السعر قبل الخصم',
      'الخصم',
      'السعر بعد الخصم',
      'فرق التقريب',
      'البيع النهائي',
      'الربح',
      'ملاحظات'
    ],
    rows
  );

  downloadTextFile(`sales-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('تم تصدير المبيعات CSV');
}

function exportStockCSV() {
  const rows = dashboardData.materials.map((material) => [
    material.name,
    material.type,
    material.color,
    material.weight,
    material.remaining,
    material.price,
    material.lowStockThreshold,
    material.supplier
  ]);

  const csv = buildCSV(
    ['الخامة', 'النوع', 'اللون', 'الوزن', 'المتبقي', 'السعر', 'حد التنبيه', 'المورد'],
    rows
  );

  downloadTextFile(`stock-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('تم تصدير المخزون CSV');
}

function exportStockMovementsCSV() {
  const rows = dashboardData.stockMovements.map((movement) => [
    formatDateTime(movement.createdAt),
    movement.materialName,
    getMovementTypeText(movement.movementType),
    movement.quantity,
    movement.reason,
    movement.referenceCode
  ]);

  const csv = buildCSV(
    ['التاريخ', 'الخامة', 'النوع', 'الكمية', 'السبب', 'المرجع'],
    rows
  );

  downloadTextFile(`stock-movements-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('تم تصدير حركة المخزون CSV');
}

function exportCustomersCSV() {
  const rows = getCustomersSummary().map((customer) => [
    customer.name,
    customer.count,
    formatNumber(customer.revenue),
    formatNumber(customer.profit),
    customer.lastOrderCode,
    customer.lastOrderItem,
    customer.lastOrderDate
  ]);

  const csv = buildCSV(
    ['العميل', 'عدد الأوردرات', 'إجمالي الشراء', 'إجمالي الربح', 'آخر كود', 'آخر مجسم', 'آخر تاريخ'],
    rows
  );

  downloadTextFile(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('تم تصدير العملاء CSV');
}

/* Events */
function attachLiveEvents() {
  const ids = [
    'printHours',
    'manualMins',
    'profitMargin',
    'discountValue',
    'selectedPrinter',
    'packagingCost',
    'shippingCost',
    'laborRate',
    'electricityCostPerHour',
    'failurePercent',
    'defaultTaxPercent',
    'settingsDefaultTaxPercent'
  ];

  ids.forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  ['salesSearch', 'filterFrom', 'filterTo', 'filterStatus', 'filterPrinter', 'filterCustomer'].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', renderReportsTableSafe);
    el.addEventListener('change', renderReportsTableSafe);
  });

  ['pipelineSearch', 'pipelinePrinterFilter', 'pipelineFrom', 'pipelineTo'].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', renderPipeline);
    el.addEventListener('change', renderPipeline);
  });

  const customersSearch = $('customersSearch');
  if (customersSearch) {
    customersSearch.addEventListener('input', renderCustomers);
  }

  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (!view) return;

      if (view === 'order') {
        closeAllModals();
        setActiveNav('order');
        return;
      }

      switch (view) {
        case 'pipeline':
          openPipelineModal();
          break;
        case 'materials':
          openMaterialsManagerModal();
          break;
        case 'reports':
          openReports();
          break;
        case 'customers':
          openCustomersModal();
          break;
        case 'settings':
          openSettingsModal();
          break;
        default:
          setActiveNav('order');
      }
    });
  });
}

function handleWindowClick(event) {
  MODAL_IDS.forEach((modalId) => {
    const modal = $(modalId);
    if (event.target === modal) {
      closeModal(modalId);
      returnToOrderNav();
    }
  });
}

window.onclick = handleWindowClick;

/* Expose */
window.openReports = openReports;
window.closeReports = closeReports;
window.renderReportsTable = renderReportsTable;

window.openPipelineModal = openPipelineModal;
window.closePipelineModal = closePipelineModal;
window.renderPipeline = renderPipeline;
window.updateOrderStatusQuick = updateOrderStatusQuick;

window.openCustomersModal = openCustomersModal;
window.closeCustomersModal = closeCustomersModal;
window.renderCustomers = renderCustomers;
window.filterReportsByCustomer = filterReportsByCustomer;

window.openEditSale = openEditSale;
window.closeEditModal = closeEditModal;
window.saveEditedSale = saveEditedSale;
window.deleteSale = deleteSale;

window.openInvoice = openInvoice;
window.openInvoiceForCurrentEdit = openInvoiceForCurrentEdit;
window.closeInvoiceModal = closeInvoiceModal;
window.printInvoice = printInvoice;

window.openMaterialsManagerModal = openMaterialsManagerModal;
window.closeMaterialsManagerModal = closeMaterialsManagerModal;
window.openMaterialModal = openMaterialModal;
window.closeMaterialModal = closeMaterialModal;
window.editMaterial = editMaterial;
window.saveMaterial = saveMaterial;
window.deleteMaterialAction = deleteMaterialAction;

window.openPrintersManagerModal = openPrintersManagerModal;
window.closePrintersManagerModal = closePrintersManagerModal;
window.openPrinterModal = openPrinterModal;
window.closePrinterModal = closePrinterModal;
window.editPrinter = editPrinter;
window.savePrinter = savePrinter;
window.deletePrinterAction = deletePrinterAction;

window.openStockMovementsModal = openStockMovementsModal;
window.closeStockMovementsModal = closeStockMovementsModal;

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveConfig = saveConfig;

window.exportBackupJSON = exportBackupJSON;
window.importBackupJSON = importBackupJSON;
window.exportSalesCSV = exportSalesCSV;
window.exportStockCSV = exportStockCSV;
window.exportStockMovementsCSV = exportStockMovementsCSV;
window.exportCustomersCSV = exportCustomersCSV;

window.calc = calc;
window.saveSale = saveSale;
window.resetOrderForm = resetOrderForm;

window.addEventListener('error', function (event) {
  console.error(event.error || event.message);
  showToast('حصل خطأ في البرنامج. لو اتكرر ابعتلي رسالة الخطأ.', 'error');
});

window.onload = async () => {
  setValue('opDate', new Date().toISOString().slice(0, 10));
  attachLiveEvents();
  setActiveNav('order');
  await loadDashboardData();
};
