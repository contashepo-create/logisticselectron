const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  getAppInfo: () => ipcRenderer.invoke("app:info"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  printSilent: (options) => ipcRenderer.invoke("print:silent", options),
  printToPDF: (options) => ipcRenderer.invoke("print:pdf", options),
  saveFile: (options) => ipcRenderer.invoke("dialog:saveFile", options),
  openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
});
