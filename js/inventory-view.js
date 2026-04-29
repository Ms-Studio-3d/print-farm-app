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
