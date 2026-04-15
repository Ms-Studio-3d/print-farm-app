const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('farmAPI', {
  appInfo: {
    name: 'Print Farm App',
    version: '1.0.0'
  },

  isDesktopApp: true,

  ping() {
    return 'pong';
  }
});
