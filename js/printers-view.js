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
      ...dashboardData.printers.map((printer) => {
        return `<option value="${Number(printer.id)}">${escapeHtml(printer.name)}</option>`;
      })
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
