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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 750,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    title: 'Print Farm App',
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
}

function registerIpcHandlers() {
  ipcMain.handle('db:getDashboardData', async () => {
    try {
      getDb();
      return {
        success: true,
        data: getDashboardData()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في تحميل البيانات'
      };
    }
  });

  ipcMain.handle('db:getNextOrderCode', async () => {
    try {
      getDb();
      return {
        success: true,
        data: getNextOrderCode()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في إنشاء كود الأوردر'
      };
    }
  });

  ipcMain.handle('db:saveConfig', async (_, payload) => {
    try {
      getDb();

      const safePayload = payload && typeof payload === 'object' ? payload : {};

      Object.entries(safePayload).forEach(([key, value]) => {
        setConfig(key, value);
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حفظ الإعدادات'
      };
    }
  });

  ipcMain.handle('db:savePrinter', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const name = String(data.name || '').trim();

      if (!name) {
        return {
          success: false,
          message: 'اسم الطابعة مطلوب'
        };
      }

      if (data.id) {
        updatePrinter({
          id: data.id,
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

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حفظ الطابعة'
      };
    }
  });

  ipcMain.handle('db:deletePrinter', async (_, payload) => {
    try {
      getDb();
      deletePrinter(payload?.id);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حذف الطابعة'
      };
    }
  });

  ipcMain.handle('db:saveMaterial', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const name = String(data.name || '').trim();

      if (!name) {
        return {
          success: false,
          message: 'اسم الخامة مطلوب'
        };
      }

      if (Number(data.weight || 0) <= 0) {
        return {
          success: false,
          message: 'وزن الخامة لازم يكون أكبر من صفر'
        };
      }

      if (data.id) {
        updateMaterial({
          id: data.id,
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

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حفظ الخامة'
      };
    }
  });

  ipcMain.handle('db:deleteMaterial', async (_, payload) => {
    try {
      getDb();
      deleteMaterial(payload?.id);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حذف الخامة'
      };
    }
  });

  ipcMain.handle('db:createOrder', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const itemName = String(data.itemName || '').trim();

      if (!itemName) {
        return {
          success: false,
          message: 'اسم المجسم مطلوب'
        };
      }

      if (!Array.isArray(data.materialUsage) || data.materialUsage.length === 0) {
        return {
          success: false,
          message: 'لازم تضيف استهلاك خامة واحد على الأقل'
        };
      }

      createOrder({
        code: String(data.code || '').trim(),
        itemName,
        customerName: String(data.customerName || '').trim(),
        printerId: data.printerId || null,
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

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حفظ الأوردر'
      };
    }
  });

  ipcMain.handle('db:updateOrder', async (_, payload) => {
    try {
      getDb();

      const data = payload && typeof payload === 'object' ? payload : {};
      const code = String(data.code || '').trim();

      if (!code) {
        return {
          success: false,
          message: 'كود الأوردر غير موجود'
        };
      }

      updateOrder({
        code,
        itemName: String(data.itemName || '').trim(),
        customerName: String(data.customerName || '').trim(),
        printerId: data.printerId || null,
        status: String(data.status || 'new').trim(),
        notes: String(data.notes || '').trim(),
        date: String(data.date || '').trim(),
        totalCost: Number(data.totalCost || 0),
        finalPrice: Number(data.finalPrice || 0),
        profit: Number(data.profit || 0)
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في تعديل الأوردر'
      };
    }
  });

  ipcMain.handle('db:deleteOrder', async (_, payload) => {
    try {
      getDb();
      deleteOrder(payload?.code);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في حذف الأوردر'
      };
    }
  });

  ipcMain.handle('db:exportBackup', async () => {
    try {
      getDb();
      return {
        success: true,
        data: exportBackupData()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في تصدير النسخة الاحتياطية'
      };
    }
  });

  ipcMain.handle('db:importBackup', async (_, payload) => {
    try {
      getDb();

      if (!payload || typeof payload !== 'object') {
        return {
          success: false,
          message: 'ملف النسخة الاحتياطية غير صالح'
        };
      }

      replaceAllData(payload);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'فشل في استيراد النسخة الاحتياطية'
      };
    }
  });

  ipcMain.handle('dialog:confirm', async (_, payload) => {
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
