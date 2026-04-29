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
