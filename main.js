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

function asPositiveNumber(value, fallback = 0) {
  const num = asNumber(value, fallback);
  return num >= 0 ? num : fallback;
}

function asNullableId(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
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
    minHeight: 820,
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

    materialUsage: Array.isArray(data.materialUsage)
      ? data.materialUsage.map(normalizeMaterialUsageItem)
      : []
  };
}

function validatePrinterPayload(data) {
  if (!data.name) {
    throw new Error('اسم الطابعة مطلوب');
  }
}

function validateMaterialPayload(data) {
  if (!data.name) {
    throw new Error('اسم الخامة مطلوب');
  }

  if (data.weight <= 0) {
    throw new Error('وزن الخامة لازم يكون أكبر من صفر');
  }

  if (data.remaining > data.weight) {
    throw new Error('المتبقي لا يمكن أن يكون أكبر من وزن البكرة');
  }
}

function validateCreateOrderPayload(data) {
  if (!data.code) {
    throw new Error('كود الأوردر غير صالح');
  }

  if (!data.itemName) {
    throw new Error('اسم المجسم مطلوب');
  }

  if (!data.printerId) {
    throw new Error('اختار الطابعة المستخدمة');
  }

  if (!data.date) {
    throw new Error('تاريخ الأوردر مطلوب');
  }

  if (data.printHours <= 0) {
    throw new Error('وقت الطباعة لازم يكون أكبر من صفر');
  }

  if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
    throw new Error('أدخل استهلاك خامة واحدة على الأقل');
  }

  for (const item of data.materialUsage) {
    if (!item || !item.materialId) {
      throw new Error('بيانات الخامة غير صالحة');
    }

    if (asPositiveNumber(item.grams, 0) <= 0) {
      throw new Error('كمية الخامة لازم تكون أكبر من صفر');
    }
  }

  if (data.finalPrice < data.totalCost) {
    throw new Error('سعر البيع أقل من التكلفة');
  }
}

function validateUpdateOrderPayload(data) {
  if (!data.code) {
    throw new Error('كود الأوردر غير صالح');
  }

  if (!data.itemName) {
    throw new Error('اسم المجسم مطلوب');
  }

  if (!data.date) {
    throw new Error('تاريخ الأوردر مطلوب');
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
      const data = normalizeOrderPayload(payload);
      validateCreateOrderPayload(data);
      createOrder(data);
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
      const confirmedPayload = asObject(payload);
      replaceAllData(confirmedPayload);
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
