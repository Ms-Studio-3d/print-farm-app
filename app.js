let dashboardData = {
  config: {},
  printers: [],
  materials: [],
  orders: [],
  stockMovements: []
};

let currentCalc = {
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

let editingOrderCode = null;

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

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ${getCurrency()}`;
}

function getCurrency() {
  return String(dashboardData.config.currencyName || DEFAULT_CONFIG.currencyName || 'ج').trim() || 'ج';
}

function showToast(message, type = 'success') {
  const oldToast = document.getElementById('toastMsg');
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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
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

function applyConfigToInputs() {
  const farmName = document.getElementById('farmName');
  const currencyName = document.getElementById('currencyName');
  const defaultTaxPercent = document.getElementById('defaultTaxPercent');
  const laborRate = document.getElementById('laborRate');
  const electricityCostPerHour = document.getElementById('electricityCostPerHour');
  const packagingCost = document.getElementById('packagingCost');
  const failurePercent = document.getElementById('failurePercent');
  const shippingCost = document.getElementById('shippingCost');

  if (farmName) farmName.value = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;
  if (currencyName) currencyName.value = dashboardData.config.currencyName || DEFAULT_CONFIG.currencyName;
  if (defaultTaxPercent) defaultTaxPercent.value = String(toPositiveNumber(dashboardData.config.defaultTaxPercent, DEFAULT_CONFIG.defaultTaxPercent));
  if (laborRate) laborRate.value = String(toPositiveNumber(dashboardData.config.laborRate, DEFAULT_CONFIG.laborRate));
  if (electricityCostPerHour) electricityCostPerHour.value = String(toPositiveNumber(dashboardData.config.electricityCostPerHour, DEFAULT_CONFIG.electricityCostPerHour));
  if (packagingCost) packagingCost.value = String(toPositiveNumber(dashboardData.config.packagingCost, DEFAULT_CONFIG.packagingCost));
  if (failurePercent) failurePercent.value = String(toPositiveNumber(dashboardData.config.failurePercent, DEFAULT_CONFIG.failurePercent));
  if (shippingCost) shippingCost.value = String(toPositiveNumber(dashboardData.config.shippingCost, DEFAULT_CONFIG.shippingCost));
}

function updateTopTitle() {
  const appTitle = document.querySelector('.app-title');
  if (appTitle) {
    appTitle.innerText = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;
  }

  document.title = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;
}

async function setNextOrderCode() {
  const response = await window.farmAPI.getNextOrderCode();
  if (!response?.success) return;

  const nextCode = String(response.data || 'ORD-1001');
  const nextOrderCode = document.getElementById('nextOrderCode');
  if (nextOrderCode) {
    nextOrderCode.innerText = nextCode.replace('ORD-', '');
  }
}

function renderPrinters() {
  const printersList = document.getElementById('printersList');
  const printersCount = document.getElementById('printersCount');
  const activePrintersCount = document.getElementById('activePrintersCount');

  if (!printersList) return;

  printersList.innerHTML = '';

  if (printersCount) {
    printersCount.innerText = String(dashboardData.printers.length);
  }

  if (activePrintersCount) {
    activePrintersCount.innerText = String(
      dashboardData.printers.filter((printer) => printer.status === 'printing').length
    );
  }

  if (!dashboardData.printers.length) {
    printersList.innerHTML = `<div class="empty-state">لا توجد طابعات مضافة.</div>`;
    return;
  }

  dashboardData.printers.forEach((printer) => {
    const statusText = getPrinterStatusText(printer.status);

    printersList.innerHTML += `
      <div class="list-card">
        <div class="list-card-head">
          <strong>${escapeHtml(printer.name)}</strong>
          <span class="section-badge">${escapeHtml(statusText)}</span>
        </div>
        <div class="list-card-body">
          <div>الموديل: ${escapeHtml(printer.model || '-')}</div>
          <div>إهلاك/ساعة: ${formatMoney(printer.hourlyDepreciation || 0)}</div>
          <div>ملاحظات: ${escapeHtml(printer.notes || '-')}</div>
        </div>
        <div class="inline-actions" style="margin-top:10px;">
          <button class="btn btn-secondary" onclick="editPrinter(${Number(printer.id)})">تعديل</button>
          <button class="btn btn-danger" onclick="deletePrinterAction(${Number(printer.id)})">حذف</button>
        </div>
      </div>
    `;
  });
}

function getPrinterStatusText(status) {
  switch (status) {
    case 'idle': return 'متاحة';
    case 'printing': return 'تطبع الآن';
    case 'maintenance': return 'صيانة';
    case 'offline': return 'متوقفة';
    default: return 'غير محدد';
  }
}

function renderPrinterSelects() {
  const selectedPrinter = document.getElementById('selectedPrinter');
  const editPrinterSelect = document.getElementById('editPrinter');

  const options = [
    `<option value="">اختر طابعة</option>`,
    ...dashboardData.printers.map((printer) => `
      <option value="${Number(printer.id)}">${escapeHtml(printer.name)}</option>
    `)
  ].join('');

  if (selectedPrinter) {
    const oldValue = selectedPrinter.value;
    selectedPrinter.innerHTML = options;
    if ([...selectedPrinter.options].some((opt) => opt.value === oldValue)) {
      selectedPrinter.value = oldValue;
    }
  }

  if (editPrinterSelect) {
    const oldValue = editPrinterSelect.value;
    editPrinterSelect.innerHTML = options;
    if ([...editPrinterSelect.options].some((opt) => opt.value === oldValue)) {
      editPrinterSelect.value = oldValue;
    }
  }
}

function renderInventory() {
  const inventoryUI = document.getElementById('inventoryUI');
  const materialsCount = document.getElementById('materialsCount');
  const lowStockCount = document.getElementById('lowStockCount');

  if (!inventoryUI) return;

  inventoryUI.innerHTML = '';

  if (materialsCount) {
    materialsCount.innerText = String(dashboardData.materials.length);
  }

  const lowMaterials = dashboardData.materials.filter((material) => {
    return Number(material.remaining || 0) <= Number(material.lowStockThreshold || 0);
  });

  if (lowStockCount) {
    lowStockCount.innerText = String(lowMaterials.length);
  }

  if (!dashboardData.materials.length) {
    inventoryUI.innerHTML = `<div class="empty-state">لا توجد خامات مضافة.</div>`;
    return;
  }

  dashboardData.materials.forEach((material) => {
    const weight = Math.max(Number(material.weight || 0), 1);
    const remaining = toPositiveNumber(material.remaining, 0);
    const percentage = Math.max(0, Math.min(100, (remaining / weight) * 100));
    const isLow = remaining <= Number(material.lowStockThreshold || 0);

    inventoryUI.innerHTML += `
      <div class="stock-item ${isLow ? 'low' : ''}">
        <div class="stock-header">
          <span>${escapeHtml(material.name)}</span>
          <span>${remaining.toFixed(0)}g / ${weight.toFixed(0)}g</span>
        </div>

        <div class="stock-bar">
          <div class="stock-progress" style="width:${percentage}%"></div>
        </div>

        <div class="list-card-body" style="margin-top:8px;">
          <div>النوع: ${escapeHtml(material.type || '-')}</div>
          <div>اللون: ${escapeHtml(material.color || '-')}</div>
          <div>المورد: ${escapeHtml(material.supplier || '-')}</div>
          <div>السعر: ${formatMoney(material.price || 0)}</div>
          <div>حد التنبيه: ${toPositiveNumber(material.lowStockThreshold, 0).toFixed(0)}g</div>
        </div>

        <div class="inline-actions" style="margin-top:10px;">
          <button class="btn btn-secondary" onclick="editMaterial(${Number(material.id)})">تعديل</button>
          <button class="btn btn-danger" onclick="deleteMaterialAction(${Number(material.id)})">حذف</button>
        </div>
      </div>
    `;
  });
}

function renderMaterialUsageInputs() {
  const amsInputs = document.getElementById('amsInputs');
  if (!amsInputs) return;

  const previousValues = {};
  document.querySelectorAll('.ams-weight').forEach((input) => {
    previousValues[String(input.dataset.id)] = input.value;
  });

  amsInputs.innerHTML = '';

  if (!dashboardData.materials.length) {
    amsInputs.innerHTML = `<div class="empty-state">أضف خامة أولًا لكي يظهر إدخال الاستهلاك.</div>`;
    return;
  }

  dashboardData.materials.forEach((material) => {
    const lowHint = Number(material.remaining || 0) <= Number(material.lowStockThreshold || 0)
      ? '<div class="field-note">تنبيه: المخزون منخفض</div>'
      : '';

    amsInputs.innerHTML += `
      <div class="form-group">
        <label>${escapeHtml(material.name)} (${toPositiveNumber(material.remaining, 0).toFixed(0)}g)</label>
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
  });

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
    const materialId = String(input.dataset.id);
    const material = getMaterialById(materialId);

    if (material && grams > 0) {
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
    }
  });

  return usage;
}

function calc() {
  const materialUsage = getMaterialUsageFromInputs();

  const printHours = toPositiveNumber(document.getElementById('printHours')?.value, 0);
  const manualMinutes = toPositiveNumber(document.getElementById('manualMins')?.value, 0);
  const profitMargin = toPositiveNumber(document.getElementById('profitMargin')?.value, 0);
  const packagingCost = toPositiveNumber(document.getElementById('packagingCost')?.value, getConfigNumber('packagingCost'));
  const shippingCost = toPositiveNumber(document.getElementById('shippingCost')?.value, getConfigNumber('shippingCost'));
  const laborRate = toPositiveNumber(document.getElementById('laborRate')?.value, getConfigNumber('laborRate'));
  const electricityCostPerHour = toPositiveNumber(
    document.getElementById('electricityCostPerHour')?.value,
    getConfigNumber('electricityCostPerHour')
  );
  const failurePercent = toPositiveNumber(
    document.getElementById('failurePercent')?.value,
    getConfigNumber('failurePercent')
  );
  const defaultTaxPercent = toPositiveNumber(
    document.getElementById('defaultTaxPercent')?.value,
    getConfigNumber('defaultTaxPercent')
  );

  let materialCost = 0;
  materialUsage.forEach((entry) => {
    materialCost += Number(entry.totalCost || 0);
  });

  const selectedPrinterId = document.getElementById('selectedPrinter')?.value || '';
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
}

function resetOrderForm() {
  const itemName = document.getElementById('itemName');
  const customerName = document.getElementById('customerName');
  const selectedPrinter = document.getElementById('selectedPrinter');
  const printHours = document.getElementById('printHours');
  const manualMins = document.getElementById('manualMins');
  const opDate = document.getElementById('opDate');
  const orderStatus = document.getElementById('orderStatus');
  const orderNotes = document.getElementById('orderNotes');
  const profitMargin = document.getElementById('profitMargin');

  if (itemName) itemName.value = '';
  if (customerName) customerName.value = '';
  if (selectedPrinter) selectedPrinter.value = '';
  if (printHours) printHours.value = '0';
  if (manualMins) manualMins.value = '15';
  if (opDate) opDate.value = new Date().toISOString().slice(0, 10);
  if (orderStatus) orderStatus.value = 'new';
  if (orderNotes) orderNotes.value = '';
  if (profitMargin) profitMargin.value = '100';

  document.querySelectorAll('.ams-weight').forEach((input) => {
    input.value = '';
  });

  applyConfigToInputs();

  currentCalc = {
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

  resetResultsPanel();
  setNextOrderCode();
  calc();
}

function validateOrderBeforeSave() {
  const itemName = String(document.getElementById('itemName')?.value || '').trim();
  const printHours = toPositiveNumber(document.getElementById('printHours')?.value, 0);
  const printerId = document.getElementById('selectedPrinter')?.value || '';
  const materialUsage = getMaterialUsageFromInputs();

  if (!itemName) {
    showToast('اسم المجسم مطلوب', 'error');
    document.getElementById('itemName')?.focus();
    return { valid: false };
  }

  if (!printerId) {
    showToast('اختار الطابعة المستخدمة', 'error');
    document.getElementById('selectedPrinter')?.focus();
    return { valid: false };
  }

  if (printHours <= 0) {
    showToast('وقت الطباعة لازم يكون أكبر من صفر', 'error');
    document.getElementById('printHours')?.focus();
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
    customerName: String(document.getElementById('customerName')?.value || '').trim(),
    printerId: Number(validation.printerId),
    status: String(document.getElementById('orderStatus')?.value || 'new').trim(),
    printHours: toPositiveNumber(document.getElementById('printHours')?.value, 0),
    manualMinutes: toPositiveNumber(document.getElementById('manualMins')?.value, 0),
    notes: String(document.getElementById('orderNotes')?.value || '').trim(),
    date: document.getElementById('opDate')?.value || new Date().toISOString().slice(0, 10),
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
}

function getFilteredOrders() {
  const search = String(document.getElementById('salesSearch')?.value || '').trim().toLowerCase();
  const from = document.getElementById('filterFrom')?.value || '';
  const to = document.getElementById('filterTo')?.value || '';
  const filterStatus = document.getElementById('filterStatus')?.value || '';

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
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0));
}

function renderReportsTable() {
  const salesTableBody = document.getElementById('salesTableBody');
  if (!salesTableBody) return;

  const orders = getFilteredOrders();
  salesTableBody.innerHTML = '';

  let totalRevenue = 0;
  let totalProfit = 0;
  let topSale = 0;
  let cancelledCount = 0;

  orders.forEach((order) => {
    totalRevenue += Number(order.finalPrice || 0);
    totalProfit += Number(order.profit || 0);
    topSale = Math.max(topSale, Number(order.finalPrice || 0));

    if (String(order.status || '') === 'cancelled') {
      cancelledCount += 1;
    }

    salesTableBody.innerHTML += `
      <tr>
        <td>${escapeHtml(order.code)}</td>
        <td>${escapeHtml(order.date || '')}</td>
        <td>${escapeHtml(order.itemName || '')}</td>
        <td>${escapeHtml(order.customerName || '')}</td>
        <td>${escapeHtml(order.printerName || '-')}</td>
        <td>${escapeHtml(getOrderStatusText(order.status))}</td>
        <td>${formatMoney(order.totalCost || 0)}</td>
        <td>${formatMoney(order.finalPrice || 0)}</td>
        <td>${formatMoney(order.profit || 0)}</td>
        <td>
          <button class="action-btn edit" onclick="openEditSale('${escapeHtml(order.code)}')">تعديل</button>
          <button class="action-btn delete" onclick="deleteSale('${escapeHtml(order.code)}')">حذف</button>
        </td>
      </tr>
    `;
  });

  if (!orders.length) {
    salesTableBody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">لا توجد نتائج مطابقة.</div>
        </td>
      </tr>
    `;
  }

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
  const reportsModal = document.getElementById('reportsModal');
  if (reportsModal && reportsModal.style.display === 'flex') {
    renderReportsTable();
  }
}

function getOrderStatusText(status) {
  switch (status) {
    case 'new': return 'جديد';
    case 'printing': return 'قيد الطباعة';
    case 'finished': return 'جاهز';
    case 'delivered': return 'تم التسليم';
    case 'cancelled': return 'ملغي';
    default: return 'غير محدد';
  }
}

function openReports() {
  const modal = document.getElementById('reportsModal');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  renderReportsTable();
}

function closeReports() {
  const modal = document.getElementById('reportsModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function openEditSale(code) {
  const order = dashboardData.orders.find((item) => item.code === code);
  if (!order) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  editingOrderCode = code;

  const editCode = document.getElementById('editCode');
  const editDate = document.getElementById('editDate');
  const editStatus = document.getElementById('editStatus');
  const editName = document.getElementById('editName');
  const editCustomer = document.getElementById('editCustomer');
  const editPrinter = document.getElementById('editPrinter');
  const editNotes = document.getElementById('editNotes');
  const editCost = document.getElementById('editCost');
  const editPrice = document.getElementById('editPrice');

  if (editCode) editCode.value = order.code || '';
  if (editDate) editDate.value = order.date || '';
  if (editStatus) editStatus.value = order.status || 'new';
  if (editName) editName.value = order.itemName || '';
  if (editCustomer) editCustomer.value = order.customerName || '';
  if (editPrinter) editPrinter.value = order.printerId ? String(order.printerId) : '';
  if (editNotes) editNotes.value = order.notes || '';
  if (editCost) editCost.value = String(toPositiveNumber(order.totalCost, 0));
  if (editPrice) editPrice.value = String(toPositiveNumber(order.finalPrice, 0));

  const modal = document.getElementById('editModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  editingOrderCode = null;
}

async function saveEditedSale() {
  if (!editingOrderCode) {
    showToast('لا يوجد أوردر مفتوح للتعديل', 'error');
    return;
  }

  const payload = {
    code: editingOrderCode,
    date: document.getElementById('editDate')?.value || '',
    status: String(document.getElementById('editStatus')?.value || 'new').trim(),
    itemName: String(document.getElementById('editName')?.value || '').trim(),
    customerName: String(document.getElementById('editCustomer')?.value || '').trim(),
    printerId: document.getElementById('editPrinter')?.value ? Number(document.getElementById('editPrinter').value) : null,
    notes: String(document.getElementById('editNotes')?.value || '').trim(),
    totalCost: toPositiveNumber(document.getElementById('editCost')?.value, 0),
    finalPrice: toPositiveNumber(document.getElementById('editPrice')?.value, 0)
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
  if (!confirm('هل تريد حذف الأوردر؟ سيتم استرجاع الخامات للمخزون.')) {
    return;
  }

  const response = await window.farmAPI.deleteOrder(code);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الأوردر', 'error');
    return;
  }

  showToast('تم حذف الأوردر واسترجاع الخامات');
  await loadDashboardData();
}

function openPrintersManagerModal() {
  const modal = document.getElementById('printersManagerModal');
  if (!modal) return;

  renderPrinters();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closePrintersManagerModal() {
  const modal = document.getElementById('printersManagerModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function openMaterialsManagerModal() {
  const modal = document.getElementById('materialsManagerModal');
  if (!modal) return;

  renderInventory();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeMaterialsManagerModal() {
  const modal = document.getElementById('materialsManagerModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function openPrinterModal() {
  const printerId = document.getElementById('printerId');
  const printerName = document.getElementById('printerName');
  const printerStatus = document.getElementById('printerStatus');
  const printerModel = document.getElementById('printerModel');
  const printerHourlyDepreciation = document.getElementById('printerHourlyDepreciation');
  const printerNotes = document.getElementById('printerNotes');

  if (printerId) printerId.value = '';
  if (printerName) printerName.value = '';
  if (printerStatus) printerStatus.value = 'idle';
  if (printerModel) printerModel.value = '';
  if (printerHourlyDepreciation) printerHourlyDepreciation.value = '0';
  if (printerNotes) printerNotes.value = '';

  const modal = document.getElementById('printerModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closePrinterModal() {
  const modal = document.getElementById('printerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

function editPrinter(id) {
  const printer = getPrinterById(id);
  if (!printer) {
    showToast('الطابعة غير موجودة', 'error');
    return;
  }

  document.getElementById('printerId').value = printer.id;
  document.getElementById('printerName').value = printer.name || '';
  document.getElementById('printerStatus').value = printer.status || 'idle';
  document.getElementById('printerModel').value = printer.model || '';
  document.getElementById('printerHourlyDepreciation').value = String(toPositiveNumber(printer.hourlyDepreciation, 0));
  document.getElementById('printerNotes').value = printer.notes || '';

  const modal = document.getElementById('printerModal');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

async function savePrinter() {
  const payload = {
    id: document.getElementById('printerId')?.value || '',
    name: String(document.getElementById('printerName')?.value || '').trim(),
    status: String(document.getElementById('printerStatus')?.value || 'idle').trim(),
    model: String(document.getElementById('printerModel')?.value || '').trim(),
    hourlyDepreciation: toPositiveNumber(document.getElementById('printerHourlyDepreciation')?.value, 0),
    notes: String(document.getElementById('printerNotes')?.value || '').trim()
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

async function deletePrinterAction(id) {
  if (!confirm('هل تريد حذف الطابعة؟')) return;

  const response = await window.farmAPI.deletePrinter(id);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الطابعة', 'error');
    return;
  }

  showToast('تم حذف الطابعة');
  await loadDashboardData();
  openPrintersManagerModal();
}

function openMaterialModal() {
  const materialId = document.getElementById('materialId');
  const materialName = document.getElementById('materialName');
  const materialType = document.getElementById('materialType');
  const materialColor = document.getElementById('materialColor');
  const materialWeight = document.getElementById('materialWeight');
  const materialRemaining = document.getElementById('materialRemaining');
  const materialPrice = document.getElementById('materialPrice');
  const materialLowStock = document.getElementById('materialLowStock');
  const materialSupplier = document.getElementById('materialSupplier');

  if (materialId) materialId.value = '';
  if (materialName) materialName.value = '';
  if (materialType) materialType.value = '';
  if (materialColor) materialColor.value = '';
  if (materialWeight) materialWeight.value = '1000';
  if (materialRemaining) materialRemaining.value = '1000';
  if (materialPrice) materialPrice.value = '0';
  if (materialLowStock) materialLowStock.value = '150';
  if (materialSupplier) materialSupplier.value = '';

  const modal = document.getElementById('materialModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeMaterialModal() {
  const modal = document.getElementById('materialModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

function editMaterial(id) {
  const material = getMaterialById(id);
  if (!material) {
    showToast('الخامة غير موجودة', 'error');
    return;
  }

  document.getElementById('materialId').value = material.id;
  document.getElementById('materialName').value = material.name || '';
  document.getElementById('materialType').value = material.type || '';
  document.getElementById('materialColor').value = material.color || '';
  document.getElementById('materialWeight').value = String(toPositiveNumber(material.weight, 1000));
  document.getElementById('materialRemaining').value = String(toPositiveNumber(material.remaining, 0));
  document.getElementById('materialPrice').value = String(toPositiveNumber(material.price, 0));
  document.getElementById('materialLowStock').value = String(toPositiveNumber(material.lowStockThreshold, 150));
  document.getElementById('materialSupplier').value = material.supplier || '';

  const modal = document.getElementById('materialModal');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

async function saveMaterial() {
  const payload = {
    id: document.getElementById('materialId')?.value || '',
    name: String(document.getElementById('materialName')?.value || '').trim(),
    type: String(document.getElementById('materialType')?.value || '').trim(),
    color: String(document.getElementById('materialColor')?.value || '').trim(),
    weight: toPositiveNumber(document.getElementById('materialWeight')?.value, 0),
    remaining: toPositiveNumber(document.getElementById('materialRemaining')?.value, 0),
    price: toPositiveNumber(document.getElementById('materialPrice')?.value, 0),
    lowStockThreshold: toPositiveNumber(document.getElementById('materialLowStock')?.value, 0),
    supplier: String(document.getElementById('materialSupplier')?.value || '').trim()
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

async function deleteMaterialAction(id) {
  if (!confirm('هل تريد حذف الخامة؟')) return;

  const response = await window.farmAPI.deleteMaterial(id);

  if (!response?.success) {
    showToast(response?.message || 'فشل في حذف الخامة', 'error');
    return;
  }

  showToast('تم حذف الخامة');
  await loadDashboardData();
  openMaterialsManagerModal();
}

function openStockMovementsModal() {
  const modal = document.getElementById('stockMovementsModal');
  if (!modal) return;

  renderStockMovementsTable();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeStockMovementsModal() {
  const modal = document.getElementById('stockMovementsModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

function renderStockMovementsTable() {
  const stockMovementsBody = document.getElementById('stockMovementsBody');
  if (!stockMovementsBody) return;

  stockMovementsBody.innerHTML = '';

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

  dashboardData.stockMovements.forEach((movement) => {
    stockMovementsBody.innerHTML += `
      <tr>
        <td>${escapeHtml(formatDateTime(movement.createdAt))}</td>
        <td>${escapeHtml(movement.materialName || '')}</td>
        <td>${escapeHtml(getMovementTypeText(movement.movementType))}</td>
        <td>${Number(movement.quantity || 0).toFixed(2)} g</td>
        <td>${escapeHtml(movement.reason || '')}</td>
        <td>${escapeHtml(movement.referenceCode || '-')}</td>
      </tr>
    `;
  });
}

function renderStockMovementsTableSafe() {
  const modal = document.getElementById('stockMovementsModal');
  if (modal && modal.style.display === 'flex') {
    renderStockMovementsTable();
  }
}

function getMovementTypeText(type) {
  switch (type) {
    case 'in': return 'إضافة';
    case 'out': return 'خصم';
    case 'return': return 'استرجاع';
    case 'adjust_in': return 'زيادة يدوية';
    case 'adjust_out': return 'نقص يدوي';
    default: return type || '-';
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;

  applyConfigToInputs();
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

async function saveConfig() {
  const payload = {
    farmName: String(document.getElementById('farmName')?.value || '').trim() || DEFAULT_CONFIG.farmName,
    currencyName: String(document.getElementById('currencyName')?.value || '').trim() || DEFAULT_CONFIG.currencyName,
    defaultTaxPercent: String(toPositiveNumber(document.getElementById('defaultTaxPercent')?.value, DEFAULT_CONFIG.defaultTaxPercent)),
    laborRate: String(toPositiveNumber(document.getElementById('laborRate')?.value, DEFAULT_CONFIG.laborRate)),
    electricityCostPerHour: String(toPositiveNumber(document.getElementById('electricityCostPerHour')?.value, DEFAULT_CONFIG.electricityCostPerHour)),
    packagingCost: String(toPositiveNumber(document.getElementById('packagingCost')?.value, DEFAULT_CONFIG.packagingCost)),
    failurePercent: String(toPositiveNumber(document.getElementById('failurePercent')?.value, DEFAULT_CONFIG.failurePercent)),
    shippingCost: String(toPositiveNumber(document.getElementById('shippingCost')?.value, DEFAULT_CONFIG.shippingCost))
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
    'defaultTaxPercent'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
}

window.onclick = function(event) {
  const reportsModal = document.getElementById('reportsModal');
  const editModal = document.getElementById('editModal');
  const printerModal = document.getElementById('printerModal');
  const materialModal = document.getElementById('materialModal');
  const stockMovementsModal = document.getElementById('stockMovementsModal');
  const settingsModal = document.getElementById('settingsModal');
  const printersManagerModal = document.getElementById('printersManagerModal');
  const materialsManagerModal = document.getElementById('materialsManagerModal');

  if (event.target === reportsModal) closeReports();
  if (event.target === editModal) closeEditModal();
  if (event.target === printerModal) closePrinterModal();
  if (event.target === materialModal) closeMaterialModal();
  if (event.target === stockMovementsModal) closeStockMovementsModal();
  if (event.target === settingsModal) closeSettingsModal();
  if (event.target === printersManagerModal) closePrintersManagerModal();
  if (event.target === materialsManagerModal) closeMaterialsManagerModal();
};

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

window.onload = async () => {
  const opDate = document.getElementById('opDate');
  if (opDate) {
    opDate.value = new Date().toISOString().slice(0, 10);
  }

  attachLiveEvents();
  await loadDashboardData();
};
