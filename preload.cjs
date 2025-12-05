const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ai', {
  ask: async (prompt, text) => {
    const res = await ipcRenderer.invoke('ai:ask', { prompt, text });
    return res;
  },
  onStatus: (handler) => {
    if (typeof handler !== 'function') return () => {};
    const listener = (_e, message) => handler(message);
    ipcRenderer.on('ai:status', listener);
    return () => ipcRenderer.removeListener('ai:status', listener);
  },
});

contextBridge.exposeInMainWorld('env', {
  version: '0.1.0',
});
