const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (ticketData) => ipcRenderer.invoke('print-ticket', ticketData),
});
