import fs from "fs";
import { Config, SyncMap } from "./config";
import { createFTPClient, FTP } from "./ftp";
import Handlebars from "handlebars";
import ErrnoException = NodeJS.ErrnoException;
import { frontend } from "./ui";
import { ApplicationState } from "../shared/types";
import { match, select } from "ts-pattern";

export async function syncFiles(
  applicationState: ApplicationState
): Promise<void> {
  if (applicationState.syncInProgress) {
    frontend.log(
      "Tried to start another sync while sync was still in progress!"
    );
    return;
  }

  applicationState.syncInProgress = true;
  const ftpClient = await match(await createFTPClient(applicationState.config))
    .with({ type: "Ok", data: select() }, (res) => Promise.resolve(res))
    .with({ type: "ConnectionError", message: select() }, async (err) => {
      frontend.log(`FTP Connection error: ${err}"`);
      return void 0;
    })
    .exhaustive();

  if (ftpClient === void 0) {
    applicationState.syncInProgress = false;
    frontend.log(`Could not sync.`);
    return;
  }

  frontend.log(`Attempting to sync.`);
  for (const syncMap of applicationState.config.syncMaps) {
    await sync(syncMap, ftpClient, applicationState.config);
  }
  frontend.log(`Sync done!`);
  applicationState.syncInProgress = false;
  ftpClient.close();
}

export function toggleAutoSync(
  applicationState: ApplicationState,
  enabled: boolean
): void {
  if (applicationState.autoSyncIntervalHandler) {
    clearInterval(applicationState.autoSyncIntervalHandler);
    delete applicationState.autoSyncIntervalHandler;
  }

  if (enabled) {
    const interval = Math.max(
      applicationState.config.autoSyncIntervalInMinutes
        ? applicationState.config.autoSyncIntervalInMinutes
        : 30,
      5
    );

    frontend.log(`AutoSync enabled! Interval is ${interval} minutes.`);

    applicationState.autoSyncIntervalHandler = setInterval(
      () => syncFiles(applicationState),
      interval * 60 * 1000
    );
  } else {
    frontend.log("AutoSync disabled!");
  }
}

async function sync(syncMap: SyncMap, ftpClient: FTP, config: Config) {
  if (!createLocalFolder(syncMap.destinationFolder).exists) {
    return;
  }

  try {
    const dir = await ftpClient.listDir(syncMap.originFolder);
    for (const item of dir) {
      const template = Handlebars.compile(syncMap.fileRenameTemplate);
      const match = item.name.match(syncMap.fileRegex);
      const templateData: { [key: string]: string } = {};
      if (match) {
        for (let i = 0; i < match.length; i++) {
          templateData["$" + i] = match[i];
        }
      }

      const newName = template(templateData);
      const remoteFile = `${syncMap.originFolder}/${item.name}`;
      const localFile = `${syncMap.destinationFolder}/${newName}`;
      if (config.debugFileNames) {
        frontend.log(`Renaming ${item.name} -> ${newName}`);
      }
      if (!fs.existsSync(localFile)) {
        frontend.log(`New episode detected, loading ${newName} now.`);
        await ftpClient.getFile(remoteFile, localFile, item.size);
      } else {
        const stat = fs.statSync(localFile);
        if (stat.size != item.size) {
          frontend.log(
            `Episode ${newName} already existed but didn't load correctly, attempting to reload now.`
          );
          await ftpClient.getFile(remoteFile, localFile, item.size);
        }
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      if ("code" in e) {
        const error = e as { code: number };
        if (error.code == 550) {
          frontend.log(
            `Directory "${syncMap.originFolder}" does not exist on remote.`
          );
        }
      } else {
        frontend.log(`Unknown error ${e.message}`);
      }
    } else {
      frontend.log(`Unknown error ${e}`);
    }
  }
}

function createLocalFolder(destinationFolder: string): { exists: boolean } {
  try {
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }
    return { exists: true };
  } catch (e) {
    if (e instanceof Error) {
      if ("code" in e) {
        const error = e as ErrnoException;
        frontend.log(
          `Could not create folder on file system, "${destinationFolder}" is faulty: "${error.message}"`
        );
      }
    }
  }
  return { exists: false };
}
