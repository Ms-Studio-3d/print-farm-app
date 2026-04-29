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

function closeInvoice() {
  currentInvoiceOrderCode = null;
  closeModal('invoiceModal');
}

function renderInvoice(order) {
  const invoiceContent = $('invoiceContent');
  if (!invoiceContent) return;

  const farmName = dashboardData.config.farmName || DEFAULT_CONFIG.farmName;

  invoiceContent.innerHTML = `
    <div class="invoice-sheet">
      <div class="invoice-header">
        <div class="invoice-brand">
          <h1>${escapeHtml(farmName)}</h1>
          <p>فاتورة طباعة ثلاثية الأبعاد</p>
          <span class="invoice-badge">${escapeHtml(getOrderStatusText(order.status))}</span>
        </div>

        <div class="invoice-meta">
          <p><strong>رقم الأوردر:</strong> ${escapeHtml(order.code || '-')}</p>
          <p><strong>التاريخ:</strong> ${escapeHtml(order.date || '-')}</p>
          <p><strong>العميل:</strong> ${escapeHtml(order.customerName || '-')}</p>
        </div>
      </div>

      <div class="invoice-section">
        <h3>بيانات الأوردر</h3>
        <div class="invoice-grid">
          <div class="invoice-box">
            <span>اسم المجسم</span>
            <strong>${escapeHtml(order.itemName || '-')}</strong>
          </div>

          <div class="invoice-box">
            <span>الطابعة</span>
            <strong>${escapeHtml(order.printerName || '-')}</strong>
          </div>

          <div class="invoice-box">
            <span>وقت الطباعة</span>
            <strong>${formatNumber(order.printHours || 0)} ساعة</strong>
          </div>

          <div class="invoice-box">
            <span>الشغل اليدوي</span>
            <strong>${formatNumber(order.manualMinutes || 0)} دقيقة</strong>
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
            <span>هالك وزن (${formatNumber(order.wasteWeight || 0)}g)</span>
            <strong>${formatMoney(order.wasteCost || 0)}</strong>
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
            <span>نسبة الفشل / المخاطرة</span>
            <strong>${formatMoney(order.riskCost || 0)}</strong>
          </div>

          <div class="invoice-box">
            <span>الضريبة</span>
            <strong>${formatMoney(order.taxCost || 0)}</strong>
          </div>

          <div class="invoice-box">
            <span>إجمالي التكلفة</span>
            <strong>${formatMoney(order.totalCost || 0)}</strong>
          </div>
        </div>
      </div>

      <div class="invoice-total">
        <div>
          <span>سعر البيع النهائي</span>
          <strong>${formatMoney(order.finalPrice || 0)}</strong>
        </div>
        <div>
          <span>صافي الربح الداخلي</span>
          <strong>${formatMoney(order.profit || 0)}</strong>
        </div>
      </div>

      ${
        order.notes
          ? `<div class="invoice-notes"><strong>ملاحظات:</strong><br>${escapeHtml(order.notes)}</div>`
          : ''
      }
    </div>
  `;
}

function printInvoice() {
  window.print();
}
