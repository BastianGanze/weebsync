import { BrowserWindow } from "electron";
import path from "path";
import { SimpleEventDispatcher } from "strongly-typed-events";
import { BottomBarUpdateEvent, CommunicationChannels } from "../shared/types";

export class Frontend {
  bufferMessagesForFirstLoad: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Array<[CommunicationChannels, any]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLog: SimpleEventDispatcher<[CommunicationChannels, any]>;

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

  updateBottomBar(event: BottomBarUpdateEvent): void {
    if (this.bufferMessagesForFirstLoad) {
      this.messages.push(["updateBottomBar", event]);
    }
    this.onLog.dispatch(["updateBottomBar", event]);
  }

  drainMessageBuffer(): Array<[string, string]> {
    const messages = this.messages;
    this.messages = [];
    return messages;
  }
}

export const frontend = new Frontend();

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

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
    mainWindow.webContents.openDevTools();
    mainWindow.webContents.on("did-finish-load", () => {
      for (const event of frontend.drainMessageBuffer()) {
        mainWindow.webContents.send(event[0], event[1]);
      }
      frontend.bufferMessagesForFirstLoad = false;

      frontend.onLog.sub((event) => {
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
