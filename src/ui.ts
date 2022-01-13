import { BrowserWindow } from "electron";
import path from "path";
import { SimpleEventDispatcher } from "strongly-typed-events";

export class Logger {
  bufferMessagesForFirstLoad: boolean;
  messages: Array<[string, string]>;
  onLog: SimpleEventDispatcher<[string, string]>;

  constructor() {
    this.bufferMessagesForFirstLoad = true;
    this.messages = [];
    this.onLog = new SimpleEventDispatcher();
  }

  log(message: string): void {
    if (this.bufferMessagesForFirstLoad) {
      this.messages.push(["log", message]);
    }
    this.onLog.dispatch(["log", message]);
  }

  bar(message: string): void {
    if (this.bufferMessagesForFirstLoad) {
      this.messages.push(["bar", message]);
    }
    this.onLog.dispatch(["bar", message]);
  }

  drainMessageBuffer(): Array<[string, string]> {
    const messages = this.messages;
    this.messages = [];
    return messages;
  }
}

export const logger = new Logger();

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
    });

    mainWindow.loadFile(path.join(__dirname, "../index.html"));

    mainWindow.webContents.on("did-finish-load", () => {
      for (const event of logger.drainMessageBuffer()) {
        mainWindow.webContents.send(event[0], event[1]);
      }
      logger.bufferMessagesForFirstLoad = false;

      logger.onLog.sub((event) => {
        mainWindow.webContents.send(event[0], event[1]);
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

export function minimizeWindow(): void {
  getWindow().minimize();
}
