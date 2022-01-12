import {
  Config,
  CONFIG_FILE_PATH,
  loadConfig,
  waitForCorrectConfig,
} from "./config";
import { createFTPClient } from "./ftp";
import { ui } from "./ui";
import { sync } from "./sync";
import { setupTemplateHelper } from "./template";
import { getSystrayOrExit } from "./systray";
import { match, select } from "ts-pattern";
import chokidar from "chokidar";

let syncInProgress = false;
let configUpdateInProgress = false;

async function start() {
  let autoSyncInterval: NodeJS.Timer;

  let config: Config = await waitForCorrectConfig();

  const configWatcher = chokidar.watch(CONFIG_FILE_PATH);
  configWatcher.on("change", async (oath) => {
    if (configUpdateInProgress) {
      return;
    }

    ui.log.write(`"${oath}" changed, trying to update configuration.`);
    configUpdateInProgress = true;
    if (syncInProgress) {
      ui.log.write("Sync is in progress, won't update configuration now.");
      configUpdateInProgress = false;
      return;
    }
    const tmpConfig = await loadConfig();
    if (tmpConfig) {
      config = tmpConfig;
      ui.log.write("Config successfully updated.");
    } else {
      ui.log.write("Config was broken, will keep the old config for now.");
    }
    configUpdateInProgress = false;
  });

  const systray = await getSystrayOrExit();

  setupTemplateHelper();

  systray.exit.sub(() => {
    process.exit(0);
  });

  systray.sync.sub(() => syncFiles(config));

  systray.autoSync.sub((enabled) => {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
    }

    if (enabled) {
      const interval = config.autoSyncIntervalInMinutes
        ? config.autoSyncIntervalInMinutes
        : 30;
      ui.log.write(`AutoSync enabled! Interval is ${interval} minutes.`);
      autoSyncInterval = setInterval(
        () => syncFiles(config),
        interval * 60 * 1000
      );
    } else {
      ui.log.write("AutoSync disabled!");
    }
  });

  if (config.syncOnStart !== false) {
    await syncFiles(config);
  }
}

async function syncFiles(config: Config) {
  if (syncInProgress) {
    ui.log.write(
      "Tried to start another sync while sync was still in progress!"
    );
    return;
  }

  syncInProgress = true;
  const ftpClient = await match(await createFTPClient(config))
    .with({ type: "Ok", data: select() }, (res) => Promise.resolve(res))
    .with({ type: "ConnectionError", message: select() }, async (err) => {
      ui.log.write(`FTP Connection error: ${err}"`);
    })
    .exhaustive();

  if (ftpClient === void 0) {
    ui.log.write(`Could not sync.`);
    return;
  }

  ui.log.write(`Attempting to sync.`);
  for (const syncMap of config.syncMaps) {
    await sync(syncMap, ftpClient);
  }
  ui.log.write(`Sync done!`);
  syncInProgress = false;
  ftpClient.close();
}

start();
