import { BrowserWindow } from "electron";
import path from "path";
import { communication } from "./communication";

let mainWindow: BrowserWindow;

function getWindow() {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      height: 600,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
      width: 800,
      minWidth: 400,
      minHeight: 400,
    });

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on("did-finish-load", () => {
      for (const event of communication.drainMessageBuffer()) {
        mainWindow.webContents.send(event.channel, event.content);
      }
      communication.bufferMessagesForFirstLoad = false;

      communication.main.dispatch.sub((event) => {
        mainWindow.webContents.send(event.channel, event.content);
      });
    });
  }

  return mainWindow;
}

export function showWindow(): void {
  getWindow().show();
}

export function hideWindow(): void {
  getWindow().hide();
}

export function maximizeWindow(): void {
  const mainWindow = getWindow();
  if (!mainWindow.isMaximized()) {
    mainWindow.maximize();
  } else {
    mainWindow.restore();
  }
}

export function minimizeWindow(): void {
  getWindow().minimize();
}
