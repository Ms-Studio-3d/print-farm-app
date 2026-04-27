let dashboardData = {
  config: {},
  printers: [],
  materials: [],
  orders: [],
  stockMovements: []
};

let currentCalc = createEmptyCalc();
let editingOrderCode = null;
let currentNavView = 'order';

const DEFAULT_CONFIG = {
  farmName: '3D Printing Business Manager',
  currencyName: 'ج',
  laborRate: 50,
  electricityCostPerHour: 3,
  packagingCost: 10,
  failurePercent: 10,
  shippingCost: 0,
  defaultTaxPercent: 0
};

const MODAL_IDS = [
  'reportsModal',
  'editModal',
  'printerModal',
  'materialModal',
  'stockMovementsModal',
  'settingsModal',
  'printersManagerModal',
  'materialsManagerModal'
];

const NAV_MODAL_MAP = {
  order: null,
  materials: 'materialsManagerModal',
  printers: 'printersManagerModal',
  reports: 'reportsModal',
  settings: 'settingsModal',
  stock: 'stockMovementsModal'
};

function createEmptyCalc() {
  return {
    materialCost: 0,
    depreciationCost: 0,
    electricityCost: 0,
    laborCost: 0,
    packagingCost: 0,
    shippingCost: 0,
    riskCost: 0,
    totalCost: 0,
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCurrency() {
  return String(dashboardData.config.currencyName || DEFAULT_CONFIG.currencyName || 'ج').trim() || 'ج';
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ${getCurrency()}`;
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
  return dashboardData.orders.find((item) => item.code === code);
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

function setActiveNav(view) {
  currentNavView = view;

  document.querySelectorAll('.nav-btn').forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle('nav-btn-active', isActive);
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

function activateNavForModal(modalId) {
  const entry = Object.entries(NAV_MODAL_MAP).find(([, value]) => value === modalId);
  if (entry) {
    setActiveNav(entry[0]);
  }
}

function returnToOrderNav() {
  const hasMainPanelOpen = Object.values(NAV_MODAL_MAP).some((modalId) => {
    return modalId && isModalOpen(modalId);
  });

  if (!hasMainPanelOpen) {
    setActiveNav('order');
  }
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

function updateTopTitle() {
  const appTitle = document.querySelector('.app-title');
  const farmName = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;

  if (appTitle) {
    appTitle.innerText = farmName;
  }

  document.title = farmName;
}

function applyConfigToInputs() {
  const defaultTax = String(
    toPositiveNumber(
      dashboardData.config.defaultTaxPercent,
      DEFAULT_CONFIG.defaultTaxPercent
    )
  );

  setValue('farmName', dashboardData.config.farmName || DEFAULT_CONFIG.farmName);
  setValue('currencyName', dashboardData.config.currencyName || DEFAULT_CONFIG.currencyName);

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

  applyConfigToInputs();
  updateTopTitle();
  renderPrinters();
  renderPrinterSelects();
  renderInventory();
  renderMaterialUsageInputs();
  renderReportsTableSafe();
  renderStockMovementsTableSafe();
  await setNextOrderCode();
  calc();
}

function renderPrinters() {
  const printersList = $('printersList');
  if (!printersList) return;

  setText('printersCount', String(dashboardData.printers.length));
  setText(
    'activePrintersCount',
    String(dashboardData.printers.filter((printer) => printer.status === 'printing').length)
  );

  if (!dashboardData.printers.length) {
    printersList.innerHTML = `<div class="empty-state">لا توجد طابعات مضافة.</div>`;
    return;
  }

  const html = dashboardData.printers
    .map((printer) => {
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
            <div>إهلاك/ساعة: ${formatMoney(printer.hourlyDepreciation || 0)}</div>
            <div>ملاحظات: ${escapeHtml(printer.notes || '-')}</div>
          </div>

          <div class="inline-actions card-actions">
            <button class="btn btn-secondary" onclick="editPrinter(${printerId})">تعديل</button>
            <button class="btn btn-danger" onclick="deletePrinterAction(${printerId})">حذف</button>
          </div>
        </div>
      `;
    })
    .join('');

  printersList.innerHTML = html;
}

function renderPrinterSelects() {
  const options = [
    `<option value="">اختر طابعة</option>`,
    ...dashboardData.printers.map(
      (printer) => `<option value="${Number(printer.id)}">${escapeHtml(printer.name)}</option>`
    )
  ].join('');

  ['selectedPrinter', 'editPrinter'].forEach((id) => {
    const select = $(id);
    if (!select) return;

    const oldValue = select.value;
    select.innerHTML = options;

    if ([...select.options].some((opt) => opt.value === oldValue)) {
      select.value = oldValue;
    }
  });
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

  const html = dashboardData.materials
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
            <div>المورد: ${escapeHtml(material.supplier || '-')}</div>
            <div>السعر: ${formatMoney(material.price || 0)}</div>
            <div>حد التنبيه: ${toPositiveNumber(material.lowStockThreshold, 0).toFixed(0)}g</div>
          </div>

          <div class="inline-actions card-actions">
            <button class="btn btn-secondary" onclick="editMaterial(${materialId})">تعديل</button>
            <button class="btn btn-danger" onclick="deleteMaterialAction(${materialId})">حذف</button>
          </div>
        </div>
      `;
    })
    .join('');

  inventoryUI.innerHTML = html;
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

  const html = dashboardData.materials
    .map((material) => {
      const isLow = Number(material.remaining || 0) <= Number(material.lowStockThreshold || 0);
      const lowHint = isLow ? '<div class="field-note">تنبيه: المخزون منخفض</div>' : '';

      return `
        <div class="form-group">
          <label>
            ${escapeHtml(material.name)}
            <span style="color:#94a3b8">• ${escapeHtml(material.color || 'No Color')}</span>
            (${toPositiveNumber(material.remaining, 0).toFixed(0)}g)
          </label>
          <input
            type="text"
            class="ams-weight"
            data-id="${Number(material.id)}"
            placeholder="جرام"
            inputmode="decimal"
          />
          ${lowHint}
        </div>
      `;
    })
    .join('');

  amsInputs.innerHTML = html;

  document.querySelectorAll('.ams-weight').forEach((input) => {
    const oldValue = previousValues[String(input.dataset.id)];
    if (oldValue != null) {
      input.value = oldValue;
    }

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
  const packagingCost = toPositiveNumber(getValue('packagingCost'), getConfigNumber('packagingCost'));
  const shippingCost = toPositiveNumber(getValue('shippingCost'), getConfigNumber('shippingCost'));
  const laborRate = toPositiveNumber(getValue('laborRate'), getConfigNumber('laborRate'));
  const electricityCostPerHour = toPositiveNumber(
    getValue('electricityCostPerHour'),
    getConfigNumber('electricityCostPerHour')
  );
  const failurePercent = toPositiveNumber(
    getValue('failurePercent'),
    getConfigNumber('failurePercent')
  );
  const defaultTaxPercent = toPositiveNumber(
    getValue('defaultTaxPercent'),
    getConfigNumber('defaultTaxPercent')
  );

  const materialCost = materialUsage.reduce((sum, entry) => {
    return sum + Number(entry.totalCost || 0);
  }, 0);

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
  const finalPrice = Math.ceil(totalCost * (1 + (profitMargin / 100)));
  const profit = finalPrice - totalCost;

  setText('resMat', formatMoney(materialCost));
  setText('resDep', formatMoney(depreciationCost));
  setText('resElectricity', formatMoney(electricityCost));
  setText('resLabor', formatMoney(laborCost));
  setText('resPackaging', formatMoney(packagingCost));
  setText('resShipping', formatMoney(shippingCost));
  setText('resRisk', formatMoney(riskCost + taxCost));
  setText('resTotal', formatMoney(totalCost));
  setText('resFinal', formatMoney(finalPrice));
  setText('resProfit', formatMoney(profit));

  currentCalc = {
    materialCost: Number(materialCost.toFixed(2)),
    depreciationCost: Number(depreciationCost.toFixed(2)),
    electricityCost: Number(electricityCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    packagingCost: Number(packagingCost.toFixed(2)),
    shippingCost: Number(shippingCost.toFixed(2)),
    riskCost: Number((riskCost + taxCost).toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    profit: Number(profit.toFixed(2)),
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
  setText('resTotal', formatMoney(0));
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

  return {
    valid: true,
    itemName,
    printerId,
    materialUsage
  };
}

async function saveSale() {
  const validation = validateOrderBeforeSave();
  if (!validation.valid) return;

  const responseCode = await window.farmAPI.getNextOrderCode();
  if (!responseCode?.success) {
    showToast(responseCode?.message || 'فشل في إنشاء كود الأوردر', 'error');
    return;
  }

  const payload = {
    code: String(responseCode.data || 'ORD-1001'),
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
    totalCost: currentCalc.totalCost,
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

function getFilteredOrders() {
  const search = getTrimmedValue('salesSearch').toLowerCase();
  const from = getValue('filterFrom');
  const to = getValue('filterTo');
  const filterStatus = getValue('filterStatus');

  return [...dashboardData.orders]
    .filter((order) => {
      const code = String(order.code || '').toLowerCase();
      const itemName = String(order.itemName || '').toLowerCase();
      const customerName = String(order.customerName || '').toLowerCase();
      const notes = String(order.notes || '').toLowerCase();
      const status = String(order.status || '');

      const matchesSearch =
        !search ||
        code.includes(search) ||
        itemName.includes(search) ||
        customerName.includes(search) ||
        notes.includes(search);

      const matchesFrom = !from || (order.date && order.date >= from);
      const matchesTo = !to || (order.date && order.date <= to);
      const matchesStatus = !filterStatus || status === filterStatus;

      return matchesSearch && matchesFrom && matchesTo && matchesStatus;
    })
    .sort((a, b) => {
      return String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0);
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

  const rowsHtml = orders
    .map((order) => {
      totalRevenue += Number(order.finalPrice || 0);
      totalProfit += Number(order.profit || 0);
      topSale = Math.max(topSale, Number(order.finalPrice || 0));

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
          <td>
            <span class="status-chip ${statusClass}">
              ${escapeHtml(getOrderStatusText(order.status))}
            </span>
          </td>
          <td>${formatMoney(order.totalCost || 0)}</td>
          <td>${formatMoney(order.finalPrice || 0)}</td>
          <td>${formatMoney(order.profit || 0)}</td>
          <td>
            <button class="action-btn edit" onclick="openEditSale('${escapeHtml(order.code)}')">تعديل</button>
            <button class="action-btn delete" onclick="deleteSale('${escapeHtml(order.code)}')">حذف</button>
          </td>
        </tr>
      `;
    })
    .join('');

  salesTableBody.innerHTML = orders.length
    ? rowsHtml
    : `
      <tr>
        <td colspan="10">
          <div class="empty-state">لا توجد نتائج مطابقة.</div>
        </td>
      </tr>
    `;

  const lowestStockMaterial = [...dashboardData.materials]
    .sort((a, b) => Number(a.remaining || 0) - Number(b.remaining || 0))[0];

  setText('statRev', formatMoney(totalRevenue));
  setText('statProfit', formatMoney(totalProfit));
  setText('statCount', String(orders.length));
  setText('statTop', formatMoney(topSale));
  setText('statCancelled', String(cancelledCount));
  setText(
    'statLowestStock',
    lowestStockMaterial
      ? `${lowestStockMaterial.name} (${toPositiveNumber(lowestStockMaterial.remaining, 0).toFixed(0)}g)`
      : '-'
  );
}

function renderReportsTableSafe() {
  if (isModalOpen('reportsModal')) {
    renderReportsTable();
  }
}

function openReports() {
  setActiveNav('reports');
  openModal('reportsModal');
  renderReportsTable();
}

function closeReports() {
  closeModal('reportsModal');
  returnToOrderNav();
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

  const payload = {
    code: editingOrderCode,
    date: getValue('editDate'),
    status: getTrimmedValue('editStatus', 'new'),
    itemName: getTrimmedValue('editName'),
    customerName: getTrimmedValue('editCustomer'),
    printerId: getValue('editPrinter') ? Number(getValue('editPrinter')) : null,
    notes: getTrimmedValue('editNotes'),
    totalCost: toPositiveNumber(getValue('editCost'), 0),
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

function openPrintersManagerModal() {
  setActiveNav('printers');
  renderPrinters();
  openModal('printersManagerModal');
}

function closePrintersManagerModal() {
  closeModal('printersManagerModal');
  returnToOrderNav();
}

function openMaterialsManagerModal() {
  setActiveNav('materials');
  renderInventory();
  openModal('materialsManagerModal');
}

function closeMaterialsManagerModal() {
  closeModal('materialsManagerModal');
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
  activateNavForModal('printersManagerModal');
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
  if (result?.archived) {
    return 'الطابعة مستخدمة في أوردرات سابقة، لذلك تم أرشفتها بدل حذفها';
  }

  if (result?.deleted) {
    return 'تم حذف الطابعة نهائيًا';
  }

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
  activateNavForModal('materialsManagerModal');
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
  if (result?.archived) {
    return 'الخامة مستخدمة في أوردرات سابقة، لذلك تم أرشفتها بدل حذفها';
  }

  if (result?.deleted) {
    return 'تم حذف الخامة نهائيًا';
  }

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

function renderStockMovementsTable() {
  const stockMovementsBody = $('stockMovementsBody');
  if (!stockMovementsBody) return;

  if (!dashboardData.stockMovements.length) {
    stockMovementsBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">لا توجد حركة مخزون.</div>
        </td>
      </tr>
    `;
    return;
  }

  const html = dashboardData.stockMovements
    .map((movement) => {
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
    })
    .join('');

  stockMovementsBody.innerHTML = html;
}

function renderStockMovementsTableSafe() {
  if (isModalOpen('stockMovementsModal')) {
    renderStockMovementsTable();
  }
}

function openStockMovementsModal() {
  setActiveNav('stock');
  renderStockMovementsTable();
  openModal('stockMovementsModal');
}

function closeStockMovementsModal() {
  closeModal('stockMovementsModal');
  returnToOrderNav();
}

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
  const payload = {
    farmName: getTrimmedValue('farmName') || DEFAULT_CONFIG.farmName,
    currencyName: getTrimmedValue('currencyName') || DEFAULT_CONFIG.currencyName,

    defaultTaxPercent: String(
      toPositiveNumber(
        getValue('settingsDefaultTaxPercent'),
        DEFAULT_CONFIG.defaultTaxPercent
      )
    ),

    laborRate: String(toPositiveNumber(getValue('laborRate'), DEFAULT_CONFIG.laborRate)),

    electricityCostPerHour: String(
      toPositiveNumber(getValue('electricityCostPerHour'), DEFAULT_CONFIG.electricityCostPerHour)
    ),

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

async function exportBackupJSON() {
  const response = await window.farmAPI.exportBackup();

  if (!response?.success) {
    showToast(response?.message || 'فشل في تصدير النسخة الاحتياطية', 'error');
    return;
  }

  const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `3d-printing-business-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
  showToast('تم تصدير النسخة الاحتياطية');
}

function importBackupJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
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

function attachLiveEvents() {
  const ids = [
    'printHours',
    'manualMins',
    'profitMargin',
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

  ['salesSearch', 'filterFrom', 'filterTo', 'filterStatus'].forEach((id) => {
    const el = $(id);
    if (!el) return;

    el.addEventListener('input', renderReportsTableSafe);
    el.addEventListener('change', renderReportsTableSafe);
  });

  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (!view) return;

      if (view === 'order') {
        MODAL_IDS.forEach((modalId) => closeModal(modalId));
        setActiveNav('order');
        return;
      }

      const modalId = NAV_MODAL_MAP[view];
      if (!modalId) return;

      MODAL_IDS.forEach((id) => {
        if (id !== modalId && NAV_MODAL_MAP.order !== id) {
          closeModal(id);
        }
      });

      switch (view) {
        case 'materials':
          openMaterialsManagerModal();
          break;
        case 'printers':
          openPrintersManagerModal();
          break;
        case 'reports':
          openReports();
          break;
        case 'settings':
          openSettingsModal();
          break;
        case 'stock':
          openStockMovementsModal();
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

window.openReports = openReports;
window.closeReports = closeReports;
window.openEditSale = openEditSale;
window.closeEditModal = closeEditModal;
window.saveEditedSale = saveEditedSale;
window.deleteSale = deleteSale;

window.openPrintersManagerModal = openPrintersManagerModal;
window.closePrintersManagerModal = closePrintersManagerModal;
window.openPrinterModal = openPrinterModal;
window.closePrinterModal = closePrinterModal;
window.editPrinter = editPrinter;
window.savePrinter = savePrinter;
window.deletePrinterAction = deletePrinterAction;

window.openMaterialsManagerModal = openMaterialsManagerModal;
window.closeMaterialsManagerModal = closeMaterialsManagerModal;
window.openMaterialModal = openMaterialModal;
window.closeMaterialModal = closeMaterialModal;
window.editMaterial = editMaterial;
window.saveMaterial = saveMaterial;
window.deleteMaterialAction = deleteMaterialAction;

window.openStockMovementsModal = openStockMovementsModal;
window.closeStockMovementsModal = closeStockMovementsModal;

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveConfig = saveConfig;

window.exportBackupJSON = exportBackupJSON;
window.importBackupJSON = importBackupJSON;
window.calc = calc;
window.saveSale = saveSale;
window.renderReportsTable = renderReportsTable;

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
