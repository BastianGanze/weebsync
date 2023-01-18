import { contextBridge, ipcRenderer } from "electron";
import { IpcListener } from "../shared/types";

contextBridge.exposeInMainWorld("api", {
  send: (channel: string, data: string) => {
    ipcRenderer.send(channel, data);
  },
  receive: (
    channel: string,
    func: (...args: string[]) => void
  ): IpcListener => {
    const listener = (event: Electron.IpcRendererEvent, ...args: never[]) =>
      func(...args);
    ipcRenderer.on(channel, listener);
    return listener;
  },
  unsub: (channel: string, listener: IpcListener) => {
    ipcRenderer.removeListener(channel, listener);
  },
});
