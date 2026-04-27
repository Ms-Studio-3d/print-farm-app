const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const {
  getDb,
  getDashboardData,
  getNextOrderCode,
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
  replaceAllData,
  exportBackupData
} = require('./database');

let mainWindow = null;
let ipcHandlersRegistered = false;

const CHANNELS = {
  getDashboardData: 'db:getDashboardData',
  getNextOrderCode: 'db:getNextOrderCode',
  saveConfig: 'db:saveConfig',
  savePrinter: 'db:savePrinter',
  deletePrinter: 'db:deletePrinter',
  saveMaterial: 'db:saveMaterial',
  deleteMaterial: 'db:deleteMaterial',
  createOrder: 'db:createOrder',
  updateOrder: 'db:updateOrder',
  deleteOrder: 'db:deleteOrder',
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

function asNullableId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1450,
    height: 950,
    minWidth: 1200,
    minHeight: 820,
    show: false,
    center: true,
    autoHideMenuBar: true,
    backgroundColor: '#050807',
    title: 'Print Farm App',
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
    status: asTrimmedString(data.status, 'idle'),
    hourlyDepreciation: asNumber(data.hourlyDepreciation, 0),
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
    weight: asNumber(data.weight, 0),
    remaining: asNumber(data.remaining, 0),
    price: asNumber(data.price, 0),
    lowStockThreshold: asNumber(data.lowStockThreshold, 0),
    supplier: asTrimmedString(data.supplier)
  };
}

function validatePrinterPayload(data) {
  if (!data.name) {
    throw new Error('اسم الطابعة مطلوب');
  }

  if (!['idle', 'printing', 'maintenance', 'offline'].includes(data.status)) {
    data.status = 'idle';
  }

  if (data.hourlyDepreciation < 0) {
    data.hourlyDepreciation = 0;
  }
}

function validateMaterialPayload(data) {
  if (!data.name) {
    throw new Error('اسم الخامة مطلوب');
  }

  if (data.weight <= 0) {
    throw new Error('وزن الخامة لازم يكون أكبر من صفر');
  }

  if (data.remaining < 0) {
    data.remaining = 0;
  }

  if (data.price < 0) {
    data.price = 0;
  }

  if (data.lowStockThreshold < 0) {
    data.lowStockThreshold = 0;
  }
}

function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;
  ipcHandlersRegistered = true;

  handleIpc(
    CHANNELS.getDashboardData,
    async () => ok(getDashboardData()),
    'فشل في تحميل البيانات'
  );

  handleIpc(
    CHANNELS.getNextOrderCode,
    async () => ok(getNextOrderCode()),
    'فشل في إنشاء كود الأوردر'
  );

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

      if (data.id) {
        updatePrinter(data);
      } else {
        createPrinter(data);
      }

      return ok();
    },
    'فشل في حفظ الطابعة'
  );

  handleIpc(
    CHANNELS.deletePrinter,
    async (payload) => {
      const id = asNullableId(asObject(payload).id);

      if (!id) {
        throw new Error('رقم الطابعة غير صالح');
      }

      const result = deletePrinter(id);
      return ok(result);
    },
    'فشل في حذف الطابعة'
  );

  handleIpc(
    CHANNELS.saveMaterial,
    async (payload) => {
      const data = normalizeMaterialPayload(payload);
      validateMaterialPayload(data);

      if (data.id) {
        updateMaterial(data);
      } else {
        createMaterial(data);
      }

      return ok();
    },
    'فشل في حفظ الخامة'
  );

  handleIpc(
    CHANNELS.deleteMaterial,
    async (payload) => {
      const id = asNullableId(asObject(payload).id);

      if (!id) {
        throw new Error('رقم الخامة غير صالح');
      }

      const result = deleteMaterial(id);
      return ok(result);
    },
    'فشل في حذف الخامة'
  );

  handleIpc(
    CHANNELS.createOrder,
    async (payload) => {
      createOrder(payload);
      return ok();
    },
    'فشل في حفظ الأوردر'
  );

  handleIpc(
    CHANNELS.updateOrder,
    async (payload) => {
      updateOrder(payload);
      return ok();
    },
    'فشل في تعديل الأوردر'
  );

  handleIpc(
    CHANNELS.deleteOrder,
    async (payload) => {
      const code = asTrimmedString(asObject(payload).code);

      if (!code) {
        throw new Error('كود الأوردر غير صالح');
      }

      deleteOrder(code);
      return ok();
    },
    'فشل في حذف الأوردر'
  );

  handleIpc(
    CHANNELS.exportBackup,
    async () => ok(exportBackupData()),
    'فشل في تصدير النسخة الاحتياطية'
  );

  handleIpc(
    CHANNELS.importBackup,
    async (payload) => {
      replaceAllData(payload);
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
  ensureDbReady();
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
