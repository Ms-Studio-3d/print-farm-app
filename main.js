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

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 750,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    title: '3D Printing Business Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
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
    if (!mainWindow) return;

    const currentUrl = mainWindow.webContents.getURL();

    if (url !== currentUrl) {
      event.preventDefault();

      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function ok(data = null) {
  return { success: true, data };
}

function fail(message) {
  return { success: false, message };
}

function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;
  ipcHandlersRegistered = true;

  ipcMain.handle('db:getDashboardData', async () => {
    try {
      getDb();
      return ok(getDashboardData());
    } catch (error) {
      return fail(error?.message || 'فشل في تحميل البيانات');
    }
  });

  ipcMain.handle('db:getNextOrderCode', async () => {
    try {
      getDb();
      return ok(getNextOrderCode());
    } catch (error) {
      return fail(error?.message || 'فشل في إنشاء كود الأوردر');
    }
  });

  ipcMain.handle('db:saveConfig', async (_, payload) => {
    try {
      getDb();

      const safePayload = payload && typeof payload === 'object' ? payload : {};

      for (const [key, value] of Object.entries(safePayload)) {
        setConfig(String(key), value);
      }

      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حفظ الإعدادات');
    }
  });

  ipcMain.handle('db:savePrinter', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const name = String(data.name || '').trim();

      if (!name) {
        return fail('اسم الطابعة مطلوب');
      }

      if (data.id) {
        updatePrinter({
          id: Number(data.id),
          name,
          model: String(data.model || '').trim(),
          status: String(data.status || 'idle').trim(),
          hourlyDepreciation: Number(data.hourlyDepreciation || 0),
          notes: String(data.notes || '').trim()
        });
      } else {
        createPrinter({
          name,
          model: String(data.model || '').trim(),
          status: String(data.status || 'idle').trim(),
          hourlyDepreciation: Number(data.hourlyDepreciation || 0),
          notes: String(data.notes || '').trim()
        });
      }

      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حفظ الطابعة');
    }
  });

  ipcMain.handle('db:deletePrinter', async (_, payload) => {
    try {
      getDb();

      if (!payload?.id) {
        return fail('معرف الطابعة غير موجود');
      }

      deletePrinter(Number(payload.id));
      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حذف الطابعة');
    }
  });

  ipcMain.handle('db:saveMaterial', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const name = String(data.name || '').trim();

      if (!name) {
        return fail('اسم الخامة مطلوب');
      }

      if (Number(data.weight || 0) <= 0) {
        return fail('وزن الخامة لازم يكون أكبر من صفر');
      }

      if (data.id) {
        updateMaterial({
          id: Number(data.id),
          name,
          type: String(data.type || '').trim(),
          color: String(data.color || '').trim(),
          weight: Number(data.weight || 0),
          remaining: Number(data.remaining || 0),
          price: Number(data.price || 0),
          lowStockThreshold: Number(data.lowStockThreshold || 0),
          supplier: String(data.supplier || '').trim()
        });
      } else {
        createMaterial({
          name,
          type: String(data.type || '').trim(),
          color: String(data.color || '').trim(),
          weight: Number(data.weight || 0),
          remaining: Number(data.remaining || 0),
          price: Number(data.price || 0),
          lowStockThreshold: Number(data.lowStockThreshold || 0),
          supplier: String(data.supplier || '').trim()
        });
      }

      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حفظ الخامة');
    }
  });

  ipcMain.handle('db:deleteMaterial', async (_, payload) => {
    try {
      getDb();

      if (!payload?.id) {
        return fail('معرف الخامة غير موجود');
      }

      deleteMaterial(Number(payload.id));
      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حذف الخامة');
    }
  });

  ipcMain.handle('db:createOrder', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const itemName = String(data.itemName || '').trim();

      if (!itemName) {
        return fail('اسم المجسم مطلوب');
      }

      if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
        return fail('لازم تضيف استهلاك خامة واحد على الأقل');
      }

      createOrder({
        code: String(data.code || '').trim(),
        itemName,
        customerName: String(data.customerName || '').trim(),
        printerId: data.printerId ? Number(data.printerId) : null,
        status: String(data.status || 'new').trim(),
        printHours: Number(data.printHours || 0),
        manualMinutes: Number(data.manualMinutes || 0),
        notes: String(data.notes || '').trim(),
        date: String(data.date || '').trim(),
        materialCost: Number(data.materialCost || 0),
        depreciationCost: Number(data.depreciationCost || 0),
        electricityCost: Number(data.electricityCost || 0),
        laborCost: Number(data.laborCost || 0),
        packagingCost: Number(data.packagingCost || 0),
        shippingCost: Number(data.shippingCost || 0),
        riskCost: Number(data.riskCost || 0),
        totalCost: Number(data.totalCost || 0),
        finalPrice: Number(data.finalPrice || 0),
        profit: Number(data.profit || 0),
        materialUsage: data.materialUsage.map((item) => ({
          materialId: Number(item.materialId || 0),
          materialName: String(item.materialName || '').trim(),
          grams: Number(item.grams || 0),
          pricePerGram: Number(item.pricePerGram || 0),
          totalCost: Number(item.totalCost || 0)
        }))
      });

      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حفظ الأوردر');
    }
  });

  ipcMain.handle('db:updateOrder', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const code = String(data.code || '').trim();

      if (!code) {
        return fail('كود الأوردر غير موجود');
      }

      updateOrder({
        code,
        itemName: String(data.itemName || '').trim(),
        customerName: String(data.customerName || '').trim(),
        printerId: data.printerId ? Number(data.printerId) : null,
        status: String(data.status || 'new').trim(),
        notes: String(data.notes || '').trim(),
        date: String(data.date || '').trim(),
        totalCost: Number(data.totalCost || 0),
        finalPrice: Number(data.finalPrice || 0),
        profit: Number(data.profit || 0)
      });

      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في تعديل الأوردر');
    }
  });

  ipcMain.handle('db:deleteOrder', async (_, payload) => {
    try {
      getDb();

      const code = String(payload?.code || '').trim();
      if (!code) {
        return fail('كود الأوردر غير موجود');
      }

      deleteOrder(code);
      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في حذف الأوردر');
    }
  });

  ipcMain.handle('db:exportBackup', async () => {
    try {
      getDb();
      return ok(exportBackupData());
    } catch (error) {
      return fail(error?.message || 'فشل في تصدير النسخة الاحتياطية');
    }
  });

  ipcMain.handle('db:importBackup', async (_, payload) => {
    try {
      getDb();

      if (!payload || typeof payload !== 'object') {
        return fail('ملف النسخة الاحتياطية غير صالح');
      }

      replaceAllData(payload);
      return ok();
    } catch (error) {
      return fail(error?.message || 'فشل في استيراد النسخة الاحتياطية');
    }
  });

  ipcMain.handle('dialog:confirm', async (_, payload) => {
    try {
      const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['نعم', 'إلغاء'],
        defaultId: 0,
        cancelId: 1,
        title: 'تأكيد',
        message: String(payload?.message || 'هل أنت متأكد؟')
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
  getDb();
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('web-contents-created', (_, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
