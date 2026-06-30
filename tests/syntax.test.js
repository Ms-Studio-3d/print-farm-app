const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const files = [
  'main.js',
  'preload.js',
  'database.js',
  'js/bootstrap.js',
  'js/customers.js',
  'js/dashboard.js',
  'js/edit-orders.js',
  'js/inventory-view.js',
  'js/invoice.js',
  'js/materials-manager.js',
  'js/pipeline.js',
  'js/pricing-core.js',
  'js/pricing-orders.js',
  'js/printers-manager.js',
  'js/printers-view.js',
  'js/quotes.js',
  'js/reports.js',
  'js/settings-export.js',
  'js/state.js',
  'js/utils.js',
];

for (const file of files) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

console.log(`Syntax checks passed for ${files.length} JavaScript files`);
