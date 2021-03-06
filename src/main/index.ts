import { app, BrowserWindow } from "electron";

import { Systray } from "./systray";
import { saveConfig, waitForCorrectConfig, watchConfigChanges } from "./config";
import { setupTemplateHelper } from "./template";
import { ApplicationState } from "../shared/types";
import { syncFiles, toggleAutoSync } from "./sync";
import { communication } from "./communication";
import {
  hideWindow,
  maximizeWindow,
  minimizeWindow,
  showWindow,
} from "./main-window";
import { match } from "ts-pattern";

let applicationState: ApplicationState;

async function init() {
  applicationState = await setupApplication();
  toggleAutoSync(applicationState, true);
  communication.dispatch({
    channel: "config",
    content: JSON.parse(JSON.stringify(applicationState.config)),
  });

  watchConfigChanges(applicationState);

  hookupCommunicationEvents(applicationState);

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
    communication.dispatch({
      channel: "log",
      content: `Could not load systray! ${systray.initializationError.message}`,
    });
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

function hookupCommunicationEvents(applicationState: ApplicationState) {
  communication.frontend.command.sub((command) => {
    match(command)
      .with("exit", () => app.exit(0))
      .with("maximize", () => maximizeWindow())
      .with("minimize-to-tray", () => hideWindow())
      .with("minimize", () => minimizeWindow())
      .exhaustive();
  });
  communication.frontend.config.sub((config) => {
    saveConfig(config);
  });
  communication.main.dispatch.sub((message) => {
    if (message.channel === "config") {
      if (applicationState.autoSyncIntervalHandler) {
        toggleAutoSync(applicationState, true);
      }
      syncFiles(applicationState);
    }
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
  }
}

app.on("ready", () => {
  init();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) showWindow();
  });
});
