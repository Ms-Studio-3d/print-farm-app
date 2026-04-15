const { contextBridge, ipcRenderer } = require('electron');

function safeInvoke(channel, payload = {}) {
  return ipcRenderer.invoke(channel, payload);
}

contextBridge.exposeInMainWorld('farmAPI', {
  appInfo: {
    name: 'Print Farm App',
    version: '1.0.0'
  },

  isDesktopApp: true,

  ping() {
    return 'pong';
  },

  getDashboardData() {
    return safeInvoke('db:getDashboardData');
  },

  getNextOrderCode() {
    return safeInvoke('db:getNextOrderCode');
  },

  saveConfig(config) {
    return safeInvoke('db:saveConfig', config);
  },

  savePrinter(printer) {
    return safeInvoke('db:savePrinter', printer);
  },

  deletePrinter(id) {
    return safeInvoke('db:deletePrinter', { id });
  },

  saveMaterial(material) {
    return safeInvoke('db:saveMaterial', material);
  },

  deleteMaterial(id) {
    return safeInvoke('db:deleteMaterial', { id });
  },

  createOrder(order) {
    return safeInvoke('db:createOrder', order);
  },

  updateOrder(order) {
    return safeInvoke('db:updateOrder', order);
  },

  deleteOrder(code) {
    return safeInvoke('db:deleteOrder', { code });
  },

  exportBackup() {
    return safeInvoke('db:exportBackup');
  },

  importBackup(data) {
    return safeInvoke('db:importBackup', data);
  }
});
