import { SimpleEventDispatcher } from "strongly-typed-events";
import { Menu, nativeImage, Tray } from "electron";
import path from "path";

export class Systray {
  _tray: Tray;
  public exit: SimpleEventDispatcher<void>;
  public sync: SimpleEventDispatcher<void>;
  public showLogs: SimpleEventDispatcher<void>;
  public autoSync: SimpleEventDispatcher<boolean>;
  public doubleClickTray: SimpleEventDispatcher<void>;
  initializationError: Error | undefined;

  constructor() {
    this.initializationError = void 0;
    this.exit = new SimpleEventDispatcher();
    this.showLogs = new SimpleEventDispatcher();
    this.sync = new SimpleEventDispatcher();
    this.autoSync = new SimpleEventDispatcher();
    this.doubleClickTray = new SimpleEventDispatcher();
    try {
      this._tray = new Tray(
        nativeImage.createFromPath(path.join(__dirname, "../static/icon.ico"))
      );

      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Exit",
          type: "normal",
          click: () => {
            this.exit.dispatch();
          },
        },
        {
          label: "Sync now",
          type: "normal",
          click: () => {
            this.sync.dispatch();
          },
        },
        {
          label: "Show logs",
          type: "normal",
          click: () => {
            this.showLogs.dispatch();
          },
        },
        {
          label: "Auto sync",
          type: "checkbox",
          checked: true,
          click: (item) => {
            this.autoSync.dispatch(item.checked);
          },
        },
      ]);
      this._tray.setToolTip("weebsync");
      this._tray.setContextMenu(contextMenu);
      this._tray.on("double-click", () => {
        this.doubleClickTray.dispatch();
      });
    } catch (e) {
      this.initializationError = e;
    }
  }
}
