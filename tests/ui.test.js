const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const editOrders = fs.readFileSync(path.join(root, 'js/edit-orders.js'), 'utf8');
const reports = fs.readFileSync(path.join(root, 'js/reports.js'), 'utf8');
const purchasesAssets = fs.readFileSync(path.join(root, 'js/purchases-assets.js'), 'utf8');
const materialsManager = fs.readFileSync(path.join(root, 'js/materials-manager.js'), 'utf8');

function mustInclude(source, needle, label = needle) {
  assert.ok(source.includes(needle), `${label} was not found`);
}

['editPrinter', 'editPrintHours', 'editPrintMinutes', 'salesTableBody', 'quotesList', 'purchasesTableBody', 'assetsTableBody', 'stockMovementsTableBody'].forEach((id) => {
  mustInclude(html, `id="${id}"`, `${id} markup`);
});

mustInclude(editOrders, "showToast('اختار الطابعة المستخدمة'", 'edit screen printer validation toast');
mustInclude(editOrders, "showToast('وقت الطباعة لازم يكون أكبر من صفر'", 'edit screen print-time validation toast');
mustInclude(reports, 'showMoreReports()', 'reports load-more control');
mustInclude(purchasesAssets, 'loadMorePurchases()', 'purchases load-more control');
mustInclude(purchasesAssets, 'loadMoreAssets()', 'assets load-more control');
mustInclude(materialsManager, 'loadMoreStockMovements()', 'stock movements load-more control');

['overflow-wrap: anywhere', 'min-width: 0', 'text-overflow: ellipsis', 'overscroll-behavior: contain', 'white-space: normal'].forEach((rule) => {
  mustInclude(css, rule, `CSS readability rule ${rule}`);
});

assert.ok((css.match(/@media \(max-width:/g) || []).length >= 5, 'responsive media queries should be present');

console.log('UI tests passed');
