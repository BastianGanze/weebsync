import { app, BrowserWindow, ipcMain } from "electron";

import {
  hideWindow,
  frontend,
  minimizeWindow,
  showWindow,
  maximizeWindow,
} from "./ui";

import { Systray } from "./systray";
import { waitForCorrectConfig, watchConfigChanges } from "./config";
import { setupTemplateHelper } from "./template";
import { AppCommand, ApplicationState } from "../shared/types";
import { syncFiles, toggleAutoSync } from "./sync";
import { match } from "ts-pattern";

let applicationState: ApplicationState;

async function init() {
  applicationState = await setupApplication();

  watchConfigChanges(applicationState);

  hookupUiCommunication(applicationState);

  frontend.updateBottomBar({
    downloadSpeed: "12.34 mB/s",
    fileProgress: "100%",
  });

  if (applicationState.config.syncOnStart) {
    await syncFiles(applicationState);
  }
}

async function setupApplication(): Promise<ApplicationState> {
  setupTemplateHelper();

  const config = await waitForCorrectConfig();

  if (config.startAsTray !== true) {
    showWindow();
  }

  const systray = new Systray();

  if (systray.initializationError) {
    frontend.log(
      `Could not load systray! ${systray.initializationError.message}`
    );
    return {
      config,
      configUpdateInProgress: false,
      syncInProgress: false,
    };
  }

  return {
    configUpdateInProgress: false,
    syncInProgress: false,
    config,
    systray,
  };
}

function hookupUiCommunication(applicationState: ApplicationState) {
  ipcMain.on("command", (_, command: AppCommand) => {
    match(command)
      .with("minimize", () => minimizeWindow())
      .with("minimize-to-tray", () => hideWindow())
      .with("exit", () => app.exit(0))
      .with("maximize", () => maximizeWindow())
      .exhaustive();
  });

  if (applicationState.systray) {
    applicationState.systray.exit.sub(() => {
      app.exit(0);
    });

    applicationState.systray.showLogs.sub(() => {
      showWindow();
    });

    applicationState.systray.doubleClickTray.sub(() => {
      showWindow();
    });

    applicationState.systray.sync.sub(() => syncFiles(applicationState));

    applicationState.systray.autoSync.sub(
      toggleAutoSync.bind(void 0, applicationState)
    );
    toggleAutoSync(applicationState, true);
  }
}

app.on("ready", () => {
  init();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) showWindow();
  });
});
