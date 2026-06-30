const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  getDb,
  getDashboardData,
  getNextOrderCode,
  getNextQuoteCode,
  setConfig,
  createPrinter,
  updatePrinter,
  deletePrinter,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createOrder,
  updateOrder,
  deleteOrder,
  createQuote,
  deleteQuote,
  convertQuoteToOrder,
  replaceAllData,
  exportBackupData
} = require('./database');

let mainWindow = null;
let ipcHandlersRegistered = false;
let autoBackupTimer = null;
let autoBackupRunning = false;

function writeStartupError(error) {
  try {
    const dir = path.join(app.getPath('documents'), 'MOO3D', 'Logs');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'startup-error.log');
    const text = `[${new Date().toISOString()}] ${error?.stack || error?.message || String(error)}\n`;
    fs.appendFileSync(file, text, 'utf8');
    return file;
  } catch (_) {
    return null;
  }
}

process.on('uncaughtException', (error) => {
  const logFile = writeStartupError(error);
  try {
    dialog.showErrorBox('MOO3D Startup Error', `${error?.message || error}\n${logFile ? `\nLog: ${logFile}` : ''}`);
  } catch (_) {}
});

process.on('unhandledRejection', (error) => {
  writeStartupError(error);
});

const CHANNELS = {
  getDashboardData: 'db:getDashboardData',
  getNextOrderCode: 'db:getNextOrderCode',
  getNextQuoteCode: 'db:getNextQuoteCode',
  saveConfig: 'db:saveConfig',
  savePrinter: 'db:savePrinter',
  deletePrinter: 'db:deletePrinter',
  saveMaterial: 'db:saveMaterial',
  deleteMaterial: 'db:deleteMaterial',
  createOrder: 'db:createOrder',
  updateOrder: 'db:updateOrder',
  deleteOrder: 'db:deleteOrder',
  createQuote: 'db:createQuote',
  deleteQuote: 'db:deleteQuote',
  convertQuoteToOrder: 'db:convertQuoteToOrder',
  exportBackup: 'db:exportBackup',
  importBackup: 'db:importBackup',
  confirmDialog: 'dialog:confirm'
};

function ok(data = null) {
  return { success: true, data };
}

function fail(message) {
  return { success: false, message };
}

function ensureDbReady() {
  getDb();
}

function asObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function asTrimmedString(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function asNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asPositiveNumber(value, fallback = 0) {
  const num = asNumber(value, fallback);
  return num >= 0 ? num : fallback;
}

function asNullableId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function asPositiveInteger(value, fallback = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const integer = Math.floor(num);
  return integer > 0 ? integer : fallback;
}

function normalizeStatus(value, fallback = 'new') {
  const status = asTrimmedString(value, fallback);

  if (['new', 'printing', 'finished', 'delivered', 'cancelled'].includes(status)) {
    return status;
  }

  return fallback;
}

function normalizePrinterStatus(value, fallback = 'idle') {
  const status = asTrimmedString(value, fallback);

  if (['idle', 'printing', 'maintenance', 'offline'].includes(status)) {
    return status;
  }

  return fallback;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    center: true,
    autoHideMenuBar: true,
    backgroundColor: '#050807',
    title: '3D Print Farm App',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const currentUrl = mainWindow.webContents.getURL();

    if (url !== currentUrl) {
      event.preventDefault();

      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function handleIpc(channel, handler, fallbackMessage) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      ensureDbReady();
      return await handler(payload);
    } catch (error) {
      console.error(`[IPC ERROR] ${channel}`, error);
      return fail(error?.message || fallbackMessage || 'حدث خطأ غير متوقع');
    }
  });
}

function normalizePrinterPayload(payload) {
  const data = asObject(payload);

  return {
    id: asNullableId(data.id),
    name: asTrimmedString(data.name),
    model: asTrimmedString(data.model),
    status: normalizePrinterStatus(data.status, 'idle'),
    hourlyDepreciation: asPositiveNumber(data.hourlyDepreciation, 0),
    notes: asTrimmedString(data.notes)
  };
}

function normalizeMaterialPayload(payload) {
  const data = asObject(payload);

  return {
    id: asNullableId(data.id),
    name: asTrimmedString(data.name),
    type: asTrimmedString(data.type),
    color: asTrimmedString(data.color),
    weight: asPositiveNumber(data.weight, 0),
    remaining: asPositiveNumber(data.remaining, 0),
    price: asPositiveNumber(data.price, 0),
    lowStockThreshold: asPositiveNumber(data.lowStockThreshold, 0),
    supplier: asTrimmedString(data.supplier)
  };
}

function normalizeMaterialUsageItem(item) {
  const data = asObject(item);

  return {
    materialId: asNullableId(data.materialId),
    materialName: asTrimmedString(data.materialName),
    grams: asPositiveNumber(data.grams, 0),
    pricePerGram: asPositiveNumber(data.pricePerGram, 0),
    totalCost: asPositiveNumber(data.totalCost, 0),
    remaining: asPositiveNumber(data.remaining, 0)
  };
}

function normalizeOrderPayload(payload) {
  const data = asObject(payload);
  const finalPrice = asPositiveNumber(data.finalPrice, 0);
  return {
    code: asTrimmedString(data.code),
    itemName: asTrimmedString(data.itemName),
    customerName: asTrimmedString(data.customerName),
    printerId: asNullableId(data.printerId),
    status: normalizeStatus(data.status, 'new'),
    quantity: asPositiveInteger(data.quantity, 1),
    printHours: asPositiveNumber(data.printHours, 0),
    manualMinutes: asPositiveNumber(data.manualMinutes, 0),
    notes: asTrimmedString(data.notes),
    date: asTrimmedString(data.date),

    materialCost: asPositiveNumber(data.materialCost, 0),
    wasteWeight: asPositiveNumber(data.wasteWeight, 0),
    wasteCost: asPositiveNumber(data.wasteCost, 0),
    depreciationCost: asPositiveNumber(data.depreciationCost, 0),
    electricityCost: asPositiveNumber(data.electricityCost, 0),
    laborCost: asPositiveNumber(data.laborCost, 0),
    packagingCost: asPositiveNumber(data.packagingCost, 0),
    accessoriesCost: asPositiveNumber(data.accessoriesCost, 0),
    shippingCost: asPositiveNumber(data.shippingCost, 0),
    riskCost: asPositiveNumber(data.riskCost, 0),
    taxCost: asPositiveNumber(data.taxCost, 0),
    totalCost: asPositiveNumber(data.totalCost, 0),

    priceBeforeDiscount: asPositiveNumber(data.priceBeforeDiscount, finalPrice),
    discountValue: asPositiveNumber(data.discountValue, 0),
    priceAfterDiscount: asPositiveNumber(data.priceAfterDiscount, finalPrice),
    minimumOrderPrice: asPositiveNumber(data.minimumOrderPrice, 0),
    roundedAdjustment: asPositiveNumber(data.roundedAdjustment, 0),

    finalPrice,
    profit: asNumber(data.profit, 0),
    unitFinalPrice: asPositiveNumber(data.unitFinalPrice, finalPrice / Math.max(1, asPositiveNumber(data.quantity, 1))),
    unitTotalCost: asPositiveNumber(data.unitTotalCost, asPositiveNumber(data.totalCost, 0) / Math.max(1, asPositiveNumber(data.quantity, 1))),
    unitProfit: asNumber(data.unitProfit, asNumber(data.profit, 0) / Math.max(1, asPositiveNumber(data.quantity, 1))),
    materialUsage: Array.isArray(data.materialUsage)
      ? data.materialUsage.map(normalizeMaterialUsageItem)
      : []
  };
}

function validatePrinterPayload(data) {
  if (!data.name) throw new Error('اسم الطابعة مطلوب');
}

function validateMaterialPayload(data) {
  if (!data.name) throw new Error('اسم الخامة مطلوب');
  if (data.weight <= 0) throw new Error('وزن الخامة لازم يكون أكبر من صفر');
  if (data.remaining > data.weight) throw new Error('المتبقي لا يمكن أن يكون أكبر من وزن البكرة');
}

function validateCreateOrderPayload(data) {
  if (!data.code) throw new Error('كود الأوردر غير صالح');
  if (!data.itemName) throw new Error('اسم المجسم مطلوب');
  if (!data.printerId) throw new Error('اختار الطابعة المستخدمة');
  if (!data.date) throw new Error('تاريخ الأوردر مطلوب');
  if (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) <= 0) throw new Error('عدد القطع لازم يكون رقم صحيح موجب');
  if (data.printHours <= 0) throw new Error('وقت الطباعة لازم يكون أكبر من صفر');

  if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
    throw new Error('أدخل استهلاك خامة واحدة على الأقل');
  }

  for (const item of data.materialUsage) {
    if (!item || !item.materialId) throw new Error('بيانات الخامة غير صالحة');
    if (asPositiveNumber(item.grams, 0) <= 0) throw new Error('كمية الخامة لازم تكون أكبر من صفر');
  }

  if (data.finalPrice < data.totalCost + data.accessoriesCost + data.shippingCost) throw new Error('سعر البيع أقل من التكلفة والمصاريف المباشرة');
}

function validateUpdateOrderPayload(data) {
  if (!data.code) throw new Error('كود الأوردر غير صالح');
  if (!data.itemName) throw new Error('اسم المجسم مطلوب');
  if (!data.date) throw new Error('تاريخ الأوردر مطلوب');
  if (data.finalPrice < data.totalCost + data.accessoriesCost + data.shippingCost) throw new Error('سعر البيع أقل من التكلفة والمصاريف المباشرة');
}

function validateCreateQuotePayload(data) {
  if (!data.quoteCode) throw new Error('كود عرض السعر غير صالح');
  if (!data.itemName) throw new Error('اسم المجسم مطلوب');
  if (!data.printerId) throw new Error('اختار الطابعة المستخدمة');
  if (!data.date) throw new Error('تاريخ عرض السعر مطلوب');
  if (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) <= 0) throw new Error('عدد القطع لازم يكون رقم صحيح موجب');
  if (data.printHours <= 0) throw new Error('وقت الطباعة لازم يكون أكبر من صفر');
  if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
    throw new Error('أدخل استهلاك خامة واحدة على الأقل');
  }
  if (data.finalPrice < data.totalCost + data.accessoriesCost + data.shippingCost) throw new Error('سعر البيع أقل من التكلفة والمصاريف المباشرة');
}

function getBackupsDir() {
  return path.join(app.getPath('documents'), 'MOO3D', 'Backups');
}

function ensureBackupsDir() {
  const dir = getBackupsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createAutomaticBackup(reason = 'auto') {
  try {
    ensureDbReady();
    const dir = ensureBackupsDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeReason = String(reason || 'auto').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'auto';
    const filePath = path.join(dir, `moo3d-backup-${safeReason}-${stamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(exportBackupData(), null, 2), 'utf8');

    const backups = fs.readdirSync(dir)
      .filter((name) => /^moo3d-backup-.*\.json$/i.test(name))
      .map((name) => ({ name, fullPath: path.join(dir, name), time: fs.statSync(path.join(dir, name)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    backups.slice(10).forEach((file) => {
      try { fs.unlinkSync(file.fullPath); } catch (_) {}
    });

    return filePath;
  } catch (error) {
    console.warn('[AUTO BACKUP FAILED]', error?.message || error);
    return null;
  }
}

function scheduleAutomaticBackup(reason = 'auto', delayMs = 2000) {
  if (autoBackupTimer) {
    clearTimeout(autoBackupTimer);
  }

  autoBackupTimer = setTimeout(() => {
    autoBackupTimer = null;

    if (autoBackupRunning) {
      scheduleAutomaticBackup(reason, delayMs);
      return;
    }

    autoBackupRunning = true;

    try {
      createAutomaticBackup(reason);
    } finally {
      autoBackupRunning = false;
    }
  }, Math.max(500, Number(delayMs || 2000)));
}

function validateBackupPayload(payload) {
  const data = asObject(payload);
  const schemaVersion = Number(data.schemaVersion || 0);

  if (!data.appName || !String(data.appName).toLowerCase().includes('print farm')) {
    throw new Error('ملف النسخة الاحتياطية لا يبدو أنه خاص بالبرنامج');
  }

  if (!Number.isFinite(schemaVersion) || schemaVersion < 7) {
    throw new Error('إصدار النسخة الاحتياطية قديم أو غير صالح');
  }

  if (!data.config || typeof data.config !== 'object') {
    throw new Error('ملف النسخة الاحتياطية لا يحتوي على إعدادات صحيحة');
  }

  ['printers', 'materials', 'orders', 'orderMaterials', 'stockMovements'].forEach((key) => {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new Error(`بنية النسخة الاحتياطية غير صالحة في: ${key}`);
    }
  });

  if (data.quotes !== undefined && !Array.isArray(data.quotes)) {
    throw new Error('بنية عروض الأسعار في النسخة الاحتياطية غير صالحة');
  }

  return data;
}

function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;
  ipcHandlersRegistered = true;

  handleIpc(CHANNELS.getDashboardData, async () => ok(getDashboardData()), 'فشل في تحميل البيانات');
  handleIpc(CHANNELS.getNextOrderCode, async () => ok(getNextOrderCode()), 'فشل في إنشاء كود الأوردر');
  handleIpc(CHANNELS.getNextQuoteCode, async () => ok(getNextQuoteCode()), 'فشل في إنشاء كود عرض السعر');

  handleIpc(
    CHANNELS.saveConfig,
    async (payload) => {
      for (const [key, value] of Object.entries(asObject(payload))) {
        setConfig(key, value);
      }

      return ok();
    },
    'فشل في حفظ الإعدادات'
  );

  handleIpc(
    CHANNELS.savePrinter,
    async (payload) => {
      const data = normalizePrinterPayload(payload);
      validatePrinterPayload(data);

      if (data.id) updatePrinter(data);
      else createPrinter(data);

      return ok();
    },
    'فشل في حفظ الطابعة'
  );

  handleIpc(
    CHANNELS.deletePrinter,
    async (payload) => {
      const id = asNullableId(asObject(payload).id);
      if (!id) throw new Error('رقم الطابعة غير صالح');

      return ok(deletePrinter(id));
    },
    'فشل في حذف الطابعة'
  );

  handleIpc(
    CHANNELS.saveMaterial,
    async (payload) => {
      const data = normalizeMaterialPayload(payload);
      validateMaterialPayload(data);

      if (data.id) updateMaterial(data);
      else createMaterial(data);

      return ok();
    },
    'فشل في حفظ الخامة'
  );

  handleIpc(
    CHANNELS.deleteMaterial,
    async (payload) => {
      const id = asNullableId(asObject(payload).id);
      if (!id) throw new Error('رقم الخامة غير صالح');

      return ok(deleteMaterial(id));
    },
    'فشل في حذف الخامة'
  );

  handleIpc(
    CHANNELS.createOrder,
    async (payload) => {
      const data = normalizeOrderPayload(payload);
      validateCreateOrderPayload(data);
      createOrder(data);
      scheduleAutomaticBackup('after-order');
      return ok();
    },
    'فشل في حفظ الأوردر'
  );

  handleIpc(
    CHANNELS.updateOrder,
    async (payload) => {
      const data = normalizeOrderPayload(payload);
      validateUpdateOrderPayload(data);
      updateOrder(data);
      scheduleAutomaticBackup('after-update');
      return ok();
    },
    'فشل في تعديل الأوردر'
  );

  handleIpc(
    CHANNELS.createQuote,
    async (payload) => {
      const data = normalizeOrderPayload(payload);
      data.quoteCode = asTrimmedString(asObject(payload).quoteCode || asObject(payload).code);
      validateCreateQuotePayload(data);
      return ok(createQuote({ ...data, quoteCode: data.quoteCode }));
    },
    'فشل في حفظ عرض السعر'
  );

  handleIpc(
    CHANNELS.deleteQuote,
    async (payload) => {
      const code = asTrimmedString(asObject(payload).code);
      if (!code) throw new Error('كود عرض السعر غير صالح');
      deleteQuote(code);
      return ok();
    },
    'فشل في حذف عرض السعر'
  );

  handleIpc(
    CHANNELS.convertQuoteToOrder,
    async (payload) => {
      const quoteCode = asTrimmedString(asObject(payload).code);
      if (!quoteCode) throw new Error('كود عرض السعر غير صالح');
      const orderCode = getNextOrderCode();
      const createdOrderCode = convertQuoteToOrder(quoteCode, orderCode);
      scheduleAutomaticBackup('after-convert-quote');
      return ok(createdOrderCode);
    },
    'فشل في تحويل عرض السعر لأوردر'
  );

  handleIpc(
    CHANNELS.deleteOrder,
    async (payload) => {
      const code = asTrimmedString(asObject(payload).code);
      if (!code) throw new Error('كود الأوردر غير صالح');

      deleteOrder(code);
      scheduleAutomaticBackup('after-delete');
      return ok();
    },
    'فشل في حذف الأوردر'
  );

  handleIpc(CHANNELS.exportBackup, async () => ok(exportBackupData()), 'فشل في تصدير النسخة الاحتياطية');

  handleIpc(
    CHANNELS.importBackup,
    async (payload) => {
      const data = validateBackupPayload(payload);
      createAutomaticBackup('before-import');
      replaceAllData(data);
      scheduleAutomaticBackup('after-import');
      return ok();
    },
    'فشل في استيراد النسخة الاحتياطية'
  );

  ipcMain.handle(CHANNELS.confirmDialog, async (_event, payload) => {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['نعم', 'إلغاء'],
      defaultId: 0,
      cancelId: 1,
      title: 'تأكيد',
      message: asTrimmedString(asObject(payload).message, 'هل أنت متأكد؟')
    });

    return {
      success: true,
      confirmed: result.response === 0
    };
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  try {
    ensureDbReady();
    scheduleAutomaticBackup('startup', 8000);
    setInterval(() => scheduleAutomaticBackup('daily', 8000), 24 * 60 * 60 * 1000);
    registerIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  } catch (error) {
    const logFile = writeStartupError(error);
    dialog.showErrorBox('MOO3D لم يبدأ', `${error?.message || error}\n${logFile ? `\nتم حفظ التفاصيل في: ${logFile}` : ''}`);
    app.quit();
  }
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.on('before-quit', () => {
  createAutomaticBackup('shutdown');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
