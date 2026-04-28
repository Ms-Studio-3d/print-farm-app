const { contextBridge, ipcRenderer } = require('electron');

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

async function safeInvoke(channel, payload) {
  try {
    return await ipcRenderer.invoke(channel, payload);
  } catch (error) {
    console.error(`[PRELOAD ERROR] ${channel}`, error);

    return {
      success: false,
      message: error?.message || 'حدث خطأ أثناء تنفيذ العملية'
    };
  }
}

contextBridge.exposeInMainWorld('farmAPI', {
  getDashboardData() {
    return safeInvoke(CHANNELS.getDashboardData);
  },

  getNextOrderCode() {
    return safeInvoke(CHANNELS.getNextOrderCode);
  },

  saveConfig(config) {
    return safeInvoke(CHANNELS.saveConfig, config);
  },

  savePrinter(printer) {
    return safeInvoke(CHANNELS.savePrinter, printer);
  },

  deletePrinter(id) {
    return safeInvoke(CHANNELS.deletePrinter, { id });
  },

  saveMaterial(material) {
    return safeInvoke(CHANNELS.saveMaterial, material);
  },

  deleteMaterial(id) {
    return safeInvoke(CHANNELS.deleteMaterial, { id });
  },

  createOrder(order) {
    return safeInvoke(CHANNELS.createOrder, order);
  },

  updateOrder(order) {
    return safeInvoke(CHANNELS.updateOrder, order);
  },

  deleteOrder(code) {
    return safeInvoke(CHANNELS.deleteOrder, { code });
  },

  exportBackup() {
    return safeInvoke(CHANNELS.exportBackup);
  },

  importBackup(data) {
    return safeInvoke(CHANNELS.importBackup, data);
  },

  confirm(message) {
    return safeInvoke(CHANNELS.confirmDialog, { message });
  }
});
