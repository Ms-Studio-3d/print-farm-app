let db = JSON.parse(localStorage.getItem('farmUltimateDB')) || {
  config: { machinePrice: 60000, machineLife: 5000, laborRate: 50, kwPrice: 2 },
  inventory: [
    { id: 1, name: "PLA Black", price: 800, weight: 1000, stock: 1000 },
    { id: 2, name: "PLA White", price: 800, weight: 1000, stock: 1000 },
    { id: 3, name: "PLA Red", price: 800, weight: 1000, stock: 1000 },
    { id: 4, name: "PLA Silk Gold", price: 1200, weight: 1000, stock: 1000 }
  ],
  sales: []
};

let currentCalc = { cost: 0, price: 0, matCost: 0, dep: 0, labor: 0, extras: 0 };
let editingCode = null;

function saveDB() {
  localStorage.setItem('farmUltimateDB', JSON.stringify(db));
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(1)} ج`;
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

  setTimeout(() => toast.remove(), 2600);
}

function saveConfig() {
  db.config.machinePrice = parseFloat(document.getElementById('machinePrice').value) || 0;
  db.config.machineLife = parseFloat(document.getElementById('machineLife').value) || 1;
  db.config.laborRate = parseFloat(document.getElementById('laborRate').value) || 0;
  saveDB();
  calc();
}

function updateUI() {
  const invUI = document.getElementById('inventoryUI');
  const amsInp = document.getElementById('amsInputs');
  invUI.innerHTML = '';
  amsInp.innerHTML = '';

  db.inventory.forEach(item => {
    const perc = item.weight > 0 ? (item.stock / item.weight) * 100 : 0;

    invUI.innerHTML += `
      <div class="stock-item ${item.stock < 150 ? 'low' : ''}">
        <div class="stock-header">
          <span>${escapeHtml(item.name)}</span>
          <span>${item.stock.toFixed(0)}g</span>
        </div>
        <div class="stock-bar">
          <div class="stock-progress" style="width:${Math.min(100, Math.max(0, perc))}%"></div>
        </div>
      </div>
    `;

    amsInp.innerHTML += `
      <div class="form-group">
        <label>${escapeHtml(item.name)}</label>
        <input type="number" class="ams-weight" data-id="${item.id}" placeholder="جرام" oninput="calc()">
      </div>
    `;
  });

  document.getElementById('nextOrderCode').innerText = db.sales.length + 1001;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calc() {
  let matCost = 0;

  document.querySelectorAll('.ams-weight').forEach(inp => {
    const id = parseInt(inp.dataset.id, 10);
    const w = parseFloat(inp.value) || 0;
    const item = db.inventory.find(x => x.id === id);

    if (item && item.weight > 0) {
      matCost += w * (item.price / item.weight);
    }
  });

  const hours = parseFloat(document.getElementById('printHours').value) || 0;
  const manual = parseFloat(document.getElementById('manualMins').value) || 0;
  const margin = parseFloat(document.getElementById('profitMargin').value) || 0;

  const dep = hours * (db.config.machinePrice / Math.max(db.config.machineLife, 1));
  const labor = (manual / 60) * db.config.laborRate;
  const packaging = 10;
  const failRate = 0.10;
  const extras = packaging + ((matCost + dep + labor + packaging) * failRate);

  const baseCost = matCost + dep + labor + packaging;
  const finalCost = baseCost * (1 + failRate);
  const finalPrice = Math.ceil(finalCost + (finalCost * (margin / 100)));

  document.getElementById('resMat').innerText = formatMoney(matCost);
  document.getElementById('resDep').innerText = formatMoney(dep);
  document.getElementById('resLabor').innerText = formatMoney(labor);
  document.getElementById('resExtras').innerText = formatMoney(extras);
  document.getElementById('resTotal').innerText = formatMoney(finalCost);
  document.getElementById('resFinal').innerText = `${finalPrice} ج`;

  currentCalc = {
    cost: finalCost,
    price: finalPrice,
    matCost,
    dep,
    labor,
    extras
  };
}

function resetOrderForm() {
  document.getElementById('itemName').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('orderNotes').value = '';
  document.getElementById('printHours').value = '';
  document.getElementById('manualMins').value = '15';
  document.getElementById('profitMargin').value = '100';
  document.getElementById('opDate').valueAsDate = new Date();

  document.querySelectorAll('.ams-weight').forEach(inp => {
    inp.value = '';
  });

  currentCalc = { cost: 0, price: 0, matCost: 0, dep: 0, labor: 0, extras: 0 };
  document.getElementById('resMat').innerText = '0 ج';
  document.getElementById('resDep').innerText = '0 ج';
  document.getElementById('resLabor').innerText = '0 ج';
  document.getElementById('resExtras').innerText = '0 ج';
  document.getElementById('resTotal').innerText = '0 ج';
  document.getElementById('resFinal').innerText = '0 ج';

  updateUI();
  document.getElementById('itemName').focus();
}

function saveSale() {
  const name = document.getElementById('itemName').value.trim();
  const customerName = document.getElementById('customerName').value.trim();
  const notes = document.getElementById('orderNotes').value.trim();
  const opDate = document.getElementById('opDate').value;

  if (!name) {
    showToast('اكتب اسم المجسم الأول', 'error');
    document.getElementById('itemName').focus();
    return;
  }

  if (currentCalc.price <= 0) {
    showToast('دخل بيانات الأوردر بشكل صحيح الأول', 'error');
    return;
  }

  document.querySelectorAll('.ams-weight').forEach(inp => {
    const id = parseInt(inp.dataset.id, 10);
    const w = parseFloat(inp.value) || 0;
    const item = db.inventory.find(x => x.id === id);

    if (item) {
      item.stock = Math.max(0, item.stock - w);
    }
  });

  db.sales.push({
    code: 'ORD-' + (db.sales.length + 1001),
    date: opDate,
    name,
    customer: customerName,
    notes,
    cost: Number(currentCalc.cost.toFixed(2)),
    price: Number(currentCalc.price.toFixed(2)),
    profit: Number((currentCalc.price - currentCalc.cost).toFixed(2))
  });

  saveDB();
  resetOrderForm();
  showToast('تم تسجيل الأوردر وخصم المخزن بنجاح');
}

function getFilteredSales() {
  const search = (document.getElementById('salesSearch')?.value || '').trim().toLowerCase();
  const from = document.getElementById('filterFrom')?.value || '';
  const to = document.getElementById('filterTo')?.value || '';

  return [...db.sales]
    .filter(s => {
      const code = (s.code || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      const customer = (s.customer || '').toLowerCase();
      const matchesSearch = !search || code.includes(search) || name.includes(search) || customer.includes(search);
      const matchesFrom = !from || (s.date && s.date >= from);
      const matchesTo = !to || (s.date && s.date <= to);
      return matchesSearch && matchesFrom && matchesTo;
    })
    .reverse();
}

function openReports() {
  document.getElementById('reportsModal').style.display = 'flex';
  renderReportsTable();
}

function renderReportsTable() {
  const body = document.getElementById('salesTableBody');
  body.innerHTML = '';

  const filteredSales = getFilteredSales();
  let rev = 0;
  let prof = 0;
  let top = 0;

  filteredSales.forEach(s => {
    rev += Number(s.price || 0);
    prof += Number(s.profit || 0);
    top = Math.max(top, Number(s.price || 0));

    body.innerHTML += `
      <tr>
        <td>${escapeHtml(s.code)}</td>
        <td>${escapeHtml(s.date || '')}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.customer || '')}</td>
        <td>${escapeHtml(s.notes || '')}</td>
        <td>${formatMoney(s.cost)}</td>
        <td>${formatMoney(s.price)}</td>
        <td class="tag-profit">${formatMoney(s.profit)}</td>
        <td>
          <button class="action-btn edit" onclick="openEditSale('${escapeJsString(s.code)}')">تعديل</button>
          <button class="action-btn delete" onclick="deleteSale('${escapeJsString(s.code)}')">حذف</button>
        </td>
      </tr>
    `;
  });

  if (!filteredSales.length) {
    body.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">لا توجد نتائج مطابقة.</div>
        </td>
      </tr>
    `;
  }

  document.getElementById('statRev').innerText = `${Math.round(rev)} ج`;
  document.getElementById('statProfit').innerText = `${Math.round(prof)} ج`;
  document.getElementById('statCount').innerText = filteredSales.length;
  document.getElementById('statTop').innerText = `${Math.round(top)} ج`;
}

function escapeJsString(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function deleteSale(code) {
  if (!confirm('مسح الأوردر؟')) return;
  db.sales = db.sales.filter(s => s.code !== code);
  saveDB();
  updateUI();
  renderReportsTable();
  showToast('تم حذف الأوردر', 'success');
}

function openEditSale(code) {
  const sale = db.sales.find(s => s.code === code);
  if (!sale) return;

  editingCode = code;
  document.getElementById('editCode').value = sale.code || '';
  document.getElementById('editDate').value = sale.date || '';
  document.getElementById('editName').value = sale.name || '';
  document.getElementById('editCustomer').value = sale.customer || '';
  document.getElementById('editNotes').value = sale.notes || '';
  document.getElementById('editCost').value = sale.cost ?? 0;
  document.getElementById('editPrice').value = sale.price ?? 0;

  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  editingCode = null;
}

function saveEditedSale() {
  const sale = db.sales.find(s => s.code === editingCode);
  if (!sale) {
    showToast('الأوردر غير موجود', 'error');
    return;
  }

  const date = document.getElementById('editDate').value;
  const name = document.getElementById('editName').value.trim();
  const customer = document.getElementById('editCustomer').value.trim();
  const notes = document.getElementById('editNotes').value.trim();
  const cost = parseFloat(document.getElementById('editCost').value);
  const price = parseFloat(document.getElementById('editPrice').value);

  if (!name) {
    showToast('اسم المجسم مطلوب', 'error');
    return;
  }

  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price < 0) {
    showToast('راجع التكلفة وسعر البيع', 'error');
    return;
  }

  sale.date = date;
  sale.name = name;
  sale.customer = customer;
  sale.notes = notes;
  sale.cost = Number(cost.toFixed(2));
  sale.price = Number(price.toFixed(2));
  sale.profit = Number((price - cost).toFixed(2));

  saveDB();
  closeEditModal();
  renderReportsTable();
  updateUI();
  showToast('تم تعديل الأوردر بنجاح');
}

function closeReports() {
  document.getElementById('reportsModal').style.display = 'none';
}

function addStockPrompt() {
  const name = prompt('اسم الخامة:');
  const price = prompt('سعر البكرة:');
  const weight = prompt('وزن البكرة بالجرام (مثلا 1000):');

  if (!name || !price || !weight) return;

  const priceNum = parseFloat(price);
  const weightNum = parseFloat(weight);

  if (!Number.isFinite(priceNum) || priceNum <= 0 || !Number.isFinite(weightNum) || weightNum <= 0) {
    showToast('بيانات الخامة غير صحيحة', 'error');
    return;
  }

  db.inventory.push({
    id: Date.now(),
    name: name.trim(),
    price: priceNum,
    weight: weightNum,
    stock: weightNum
  });

  saveDB();
  updateUI();
  calc();
  showToast('تمت إضافة الخامة بنجاح');
}

function exportBackupJSON() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'farm_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تحميل النسخة الاحتياطية');
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);

      if (!parsed || !Array.isArray(parsed.inventory) || !Array.isArray(parsed.sales) || !parsed.config) {
        throw new Error('invalid');
      }

      db = parsed;
      saveDB();
      updateUI();
      resetOrderForm();
      renderReportsTableSafe();
      showToast('تم استيراد البيانات بنجاح');
    } catch {
      showToast('ملف الاستيراد غير صالح', 'error');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

function renderReportsTableSafe() {
  if (document.getElementById('reportsModal').style.display === 'flex') {
    renderReportsTable();
  }
}

window.onclick = function(event) {
  const reportsModal = document.getElementById('reportsModal');
  const editModal = document.getElementById('editModal');

  if (event.target === reportsModal) closeReports();
  if (event.target === editModal) closeEditModal();
};

window.onload = () => {
  document.getElementById('opDate').valueAsDate = new Date();
  document.getElementById('machinePrice').value = db.config.machinePrice ?? 60000;
  document.getElementById('machineLife').value = db.config.machineLife ?? 5000;
  document.getElementById('laborRate').value = db.config.laborRate ?? 50;
  updateUI();
  calc();
};
