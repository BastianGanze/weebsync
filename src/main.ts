import { app, BrowserWindow, ipcMain } from "electron";

import { hideWindow, logger, minimizeWindow, showWindow } from "./ui";

import { Systray } from "./systray";
import { waitForCorrectConfig, watchConfigChanges } from "./config";
import { setupTemplateHelper } from "./template";
import { ApplicationState } from "./types";
import { syncFiles, toggleAutoSync } from "./sync";

let applicationState: ApplicationState;

async function init() {
  applicationState = await setupApplication();

  watchConfigChanges(applicationState);

  hookupUiCommunication(applicationState);

  if (applicationState.config.syncOnStart) {
    await syncFiles(applicationState);
  }
}

async function setupApplication(): Promise<ApplicationState> {
  setupTemplateHelper();
  showWindow();

  const config = await waitForCorrectConfig();
  const systray = new Systray();

  if (systray.initializationError) {
    logger.log(
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
  ipcMain.on("command", (_, data) => {
    if (data === "minimize") {
      minimizeWindow();
    }
    if (data === "minimize-to-tray") {
      hideWindow();
    }
    if (data === "exit") {
      app.exit(0);
    }
  });

  if (applicationState.systray) {
    applicationState.systray.exit.sub(() => {
      app.exit(0);
    });

    applicationState.systray.showLogs.sub(() => {
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
