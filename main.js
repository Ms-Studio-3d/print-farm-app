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
    width: 980,
    height: 720,
    minWidth: 900,
    minHeight: 640,
    show: false,
    center: true,
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    title: '3D Printing Business Manager',
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
    if (url === currentUrl) return;

    event.preventDefault();

    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
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
      return fail(error?.message || fallbackMessage);
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

function normalizeOrderMaterialUsage(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const entry = asObject(item);

    return {
      materialId: asNullableId(entry.materialId),
      materialName: asTrimmedString(entry.materialName),
      grams: asNumber(entry.grams, 0),
      pricePerGram: asNumber(entry.pricePerGram, 0),
      totalCost: asNumber(entry.totalCost, 0)
    };
  });
}

function normalizeCreateOrderPayload(payload) {
  const data = asObject(payload);

  return {
    code: asTrimmedString(data.code),
    itemName: asTrimmedString(data.itemName),
    customerName: asTrimmedString(data.customerName),
    printerId: asNullableId(data.printerId),
    status: asTrimmedString(data.status, 'new'),
    printHours: asNumber(data.printHours, 0),
    manualMinutes: asNumber(data.manualMinutes, 0),
    notes: asTrimmedString(data.notes),
    date: asTrimmedString(data.date),
    materialCost: asNumber(data.materialCost, 0),
    depreciationCost: asNumber(data.depreciationCost, 0),
    electricityCost: asNumber(data.electricityCost, 0),
    laborCost: asNumber(data.laborCost, 0),
    packagingCost: asNumber(data.packagingCost, 0),
    shippingCost: asNumber(data.shippingCost, 0),
    riskCost: asNumber(data.riskCost, 0),
    totalCost: asNumber(data.totalCost, 0),
    finalPrice: asNumber(data.finalPrice, 0),
    profit: asNumber(data.profit, 0),
    materialUsage: normalizeOrderMaterialUsage(data.materialUsage)
  };
}

function normalizeUpdateOrderPayload(payload) {
  const data = asObject(payload);

  return {
    code: asTrimmedString(data.code),
    itemName: asTrimmedString(data.itemName),
    customerName: asTrimmedString(data.customerName),
    printerId: asNullableId(data.printerId),
    status: asTrimmedString(data.status, 'new'),
    notes: asTrimmedString(data.notes),
    date: asTrimmedString(data.date),
    totalCost: asNumber(data.totalCost, 0),
    finalPrice: asNumber(data.finalPrice, 0),
    profit: asNumber(data.profit, 0)
  };
}

function validatePrinter(data) {
  if (!data.name) {
    return 'اسم الطابعة مطلوب';
  }

  return null;
}

function validateMaterial(data) {
  if (!data.name) {
    return 'اسم الخامة مطلوب';
  }

  if (data.weight <= 0) {
    return 'وزن الخامة لازم يكون أكبر من صفر';
  }

  if (data.remaining < 0) {
    return 'الكمية المتبقية لا يمكن أن تكون سالبة';
  }

  if (data.price < 0) {
    return 'سعر الخامة لا يمكن أن يكون سالبًا';
  }

  return null;
}

function validateCreateOrder(data) {
  if (!data.itemName) {
    return 'اسم المجسم مطلوب';
  }

  if (!data.date) {
    return 'تاريخ الأوردر مطلوب';
  }

  if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
    return 'لازم تضيف استهلاك خامة واحد على الأقل';
  }

  const invalidUsage = data.materialUsage.find((item) => {
    return !item.materialId || item.grams <= 0;
  });

  if (invalidUsage) {
    return 'بيانات استهلاك الخامات غير مكتملة';
  }

  return null;
}

function validateUpdateOrder(data) {
  if (!data.code) {
    return 'كود الأوردر غير موجود';
  }

  if (!data.itemName) {
    return 'اسم المجسم مطلوب';
  }

  if (!data.date) {
    return 'تاريخ الأوردر مطلوب';
  }

  return null;
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
      const safePayload = asObject(payload);

      for (const [key, value] of Object.entries(safePayload)) {
        setConfig(asTrimmedString(key), value);
      }

      return ok();
    },
    'فشل في حفظ الإعدادات'
  );

  handleIpc(
    CHANNELS.savePrinter,
    async (payload) => {
      const data = normalizePrinterPayload(payload);
      const validationMessage = validatePrinter(data);

      if (validationMessage) {
        return fail(validationMessage);
      }

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
      const printerId = asNullableId(asObject(payload).id);

      if (!printerId) {
        return fail('معرف الطابعة غير موجود');
      }

      const result = deletePrinter(printerId);
      return ok(result);
    },
    'فشل في حذف الطابعة'
  );

  handleIpc(
    CHANNELS.saveMaterial,
    async (payload) => {
      const data = normalizeMaterialPayload(payload);
      const validationMessage = validateMaterial(data);

      if (validationMessage) {
        return fail(validationMessage);
      }

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
      const materialId = asNullableId(asObject(payload).id);

      if (!materialId) {
        return fail('معرف الخامة غير موجود');
      }

      const result = deleteMaterial(materialId);
      return ok(result);
    },
    'فشل في حذف الخامة'
  );

  handleIpc(
    CHANNELS.createOrder,
    async (payload) => {
      const data = normalizeCreateOrderPayload(payload);
      const validationMessage = validateCreateOrder(data);

      if (validationMessage) {
        return fail(validationMessage);
      }

      createOrder(data);
      return ok();
    },
    'فشل في حفظ الأوردر'
  );

  handleIpc(
    CHANNELS.updateOrder,
    async (payload) => {
      const data = normalizeUpdateOrderPayload(payload);
      const validationMessage = validateUpdateOrder(data);

      if (validationMessage) {
        return fail(validationMessage);
      }

      updateOrder(data);
      return ok();
    },
    'فشل في تعديل الأوردر'
  );

  handleIpc(
    CHANNELS.deleteOrder,
    async (payload) => {
      const code = asTrimmedString(asObject(payload).code);

      if (!code) {
        return fail('كود الأوردر غير موجود');
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
      if (!payload || typeof payload !== 'object') {
        return fail('ملف النسخة الاحتياطية غير صالح');
      }

      replaceAllData(payload);
      return ok();
    },
    'فشل في استيراد النسخة الاحتياطية'
  );

  ipcMain.handle(CHANNELS.confirmDialog, async (_event, payload) => {
    try {
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
    } catch (error) {
      return fail(error?.message || 'تعذر فتح نافذة التأكيد');
    }
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
