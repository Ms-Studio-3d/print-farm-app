const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const database = fs.readFileSync(path.join(root, 'database.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'backup-worker.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function mustInclude(source, needle, label = needle) {
  assert.ok(source.includes(needle), `${label} was not found`);
}

['getOrdersPage', 'getStockMovementsPage', 'getQuotesPage', 'getPurchasesPage', 'getAssetsPage'].forEach((name) => {
  const fnStart = database.indexOf(`function ${name}`);
  assert.notEqual(fnStart, -1, `${name} was not found`);
  const nextFn = database.indexOf('\nfunction ', fnStart + 1);
  const fnSource = database.slice(fnStart, nextFn === -1 ? database.length : nextFn);
  mustInclude(fnSource, 'LIMIT ? OFFSET ?', `${name} must use SQL pagination`);
  mustInclude(fnSource, 'COUNT(*) AS count', `${name} must expose total count`);
});

mustInclude(database, 'const DEFAULT_LIST_LIMIT = 100;', 'default page size');
mustInclude(database, 'const MAX_LIST_LIMIT = 500;', 'max page size guard');
mustInclude(database, 'function getDataPage(kind, options = {})', 'generic page loader');
mustInclude(database, 'getDashboardData({ includeAll: true })', 'backup exports intentionally request all data');
mustInclude(main, 'new Worker(path.join(__dirname, \'backup-worker.js\')', 'backup worker');
mustInclude(main, '.finally(() => {\n        autoBackupRunning = false;', 'backup state is cleared asynchronously');
mustInclude(preload, 'getDataPage(kind, options = {})', 'renderer can request pages');
mustInclude(worker, 'fs.writeFile(filePath', 'worker writes backup asynchronously');
mustInclude(worker, 'exportBackupData()', 'worker exports backup payload');
assert.ok(pkg.build.files.includes('backup-worker.js'), 'backup worker must be packaged with the Electron app');

const backupFunction = main.slice(main.indexOf('function createAutomaticBackup'), main.indexOf('function scheduleAutomaticBackup'));
assert.equal(backupFunction.includes('writeFileSync'), false, 'automatic backup must not synchronously write files in the main process');

console.log('Performance tests passed');
