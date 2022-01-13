import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  send: (channel: string, data: string) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: (...args: string[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
