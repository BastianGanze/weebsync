import { app, BrowserWindow, ipcMain } from "electron";

import { Systray } from "./systray";
import { saveConfig, waitForCorrectConfig, watchConfigChanges } from "./config";
import { setupTemplateHelper } from "./template";
import { ApplicationState } from "../shared/types";
import { abortSync, syncFiles, toggleAutoSync } from "./sync";
import { communication } from "./communication";
import {
  hideWindow,
  maximizeWindow,
  minimizeWindow,
  showWindow,
} from "./main-window";
import { match, P } from "ts-pattern";
import { createFTPClient } from "./ftp";

let applicationState: ApplicationState;

ipcMain.handle("getAppVersion", () => {
  return app.getVersion();
});

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

async function listDir(path: string) {
  await match(await createFTPClient(applicationState.config))
    .with({ type: "Ok", data: P.select() }, async (client) => {
      try {
        const result = await client.listDir(path);
        client.close();
        communication.dispatch({
          channel: "command-result",
          content: {
            type: "list-dir",
            path,
            result,
          },
        });
      } catch (err) {
        communication.dispatch({
          channel: "log",
          content: `FTP Connection error: ${err}"`,
        });
      }
    })
    .with({ type: "ConnectionError", message: P.select() }, async (err) => {
      communication.dispatch({
        channel: "log",
        content: `FTP Connection error: ${err}"`,
      });
    })
    .exhaustive();
}

async function checkDir(path: string) {
  await match(await createFTPClient(applicationState.config))
    .with({ type: "Ok", data: P.select() }, async (client) => {
      try {
        await client.cd(path);
        client.close();
        communication.dispatch({
          channel: "command-result",
          content: {
            type: "check-dir",
            exists: true,
          },
        });
      } catch (err) {
        communication.dispatch({
          channel: "command-result",
          content: {
            type: "check-dir",
            exists: false,
          },
        });
      }
    })
    .with({ type: "ConnectionError", message: P.select() }, async (err) => {
      communication.dispatch({
        channel: "log",
        content: `FTP Connection error: ${err}"`,
      });
    })
    .exhaustive();
}

function hookupCommunicationEvents(applicationState: ApplicationState) {
  communication.frontend.command.sub((command) => {
    match(command)
      .with({ type: "exit" }, () => app.exit(0))
      .with({ type: "maximize" }, () => maximizeWindow())
      .with({ type: "minimize-to-tray" }, () => hideWindow())
      .with({ type: "minimize" }, () => minimizeWindow())
      .with({ type: "sync" }, () => {
        if (applicationState.syncInProgress) {
          abortSync();
        } else {
          syncFiles(applicationState);
        }
      })
      .with(
        { type: "list-dir", path: P.select() },
        async (path) => await listDir(path)
      )
      .with(
        { type: "check-dir", path: P.select() },
        async (path) => await checkDir(path)
      )
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
