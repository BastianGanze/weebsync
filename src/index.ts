import { Config, getConfigOrExit } from "./config";
import { createFTPClient } from "./ftp";
import { ui } from "./ui";
import { sync } from "./sync";
import { setupTemplateHelper } from "./template";
import { getSystrayOrExit } from "./systray";
import { match, select } from "ts-pattern";

let syncInProgress = false;

async function start() {
  let autoSyncInterval: NodeJS.Timer;

  const config = await getConfigOrExit();

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
