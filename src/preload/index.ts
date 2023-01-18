import { contextBridge, ipcRenderer } from "electron";
import { IpcListener } from "../shared/types";

let latestVersion = "LOADING";
fetch("https://api.github.com/repos/BastianGanze/weebsync/releases/latest")
  .then((res) => res.json())
  .then((res) => {
    latestVersion = res.tag_name;
  });

contextBridge.exposeInMainWorld("api", {
  getLatestVersion: () => {
    return latestVersion;
  },
  getVersion: (): Promise<string> => {
    return new Promise((resolve, reject) => {
      ipcRenderer
        .invoke("getAppVersion")
        .then((version) => {
          resolve(version);
        })
        .catch((err) => reject(err));
    });
  },
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
