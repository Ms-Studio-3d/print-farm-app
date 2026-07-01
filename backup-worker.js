const { parentPort, workerData } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');

async function pruneOldBackups(dir, keep = 10) {
  const names = await fs.readdir(dir);
  const backups = [];

  for (const name of names) {
    if (!/^moo3d-backup-.*\.json$/i.test(name)) continue;
    const fullPath = path.join(dir, name);
    try {
      const stat = await fs.stat(fullPath);
      backups.push({ name, fullPath, time: stat.mtimeMs });
    } catch (_) {}
  }

  backups
    .sort((a, b) => b.time - a.time)
    .slice(keep)
    .forEach((file) => {
      fs.unlink(file.fullPath).catch(() => {});
    });
}

async function main() {
  const dbPath = String(workerData?.dbPath || '').trim();
  const backupsDir = String(workerData?.backupsDir || '').trim();
  const safeReason = String(workerData?.reason || 'auto').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'auto';

  if (!dbPath) throw new Error('Database path is missing');
  if (!backupsDir) throw new Error('Backup directory is missing');

  process.env.MOO3D_DB_PATH = dbPath;

  const { getDb, exportBackupData } = require('./database');
  const db = getDb();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(backupsDir, `moo3d-backup-${safeReason}-${stamp}.json`);

  await fs.mkdir(backupsDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(exportBackupData(), null, 2), 'utf8');
  await pruneOldBackups(backupsDir, 10);

  if (db && typeof db.close === 'function') db.close();
  parentPort.postMessage({ success: true, filePath });
}

main().catch((error) => {
  parentPort.postMessage({ success: false, message: error?.message || String(error) });
});
