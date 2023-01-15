import fs, { Stats } from "fs";
import { Config, SyncMap } from "./config";
import { createFTPClient, FTP } from "./ftp";
import Handlebars from "handlebars";
import ErrnoException = NodeJS.ErrnoException;
import { ApplicationState } from "../shared/types";
import { match, select } from "ts-pattern";
import { communication } from "./communication";
import { FileInfo } from "basic-ftp";

export async function syncFiles(
  applicationState: ApplicationState
): Promise<void> {
  if (applicationState.syncInProgress) {
    communication.dispatch({
      channel: "log",
      content: "Tried to start another sync while sync was still in progress!",
    });
    return;
  }

  applicationState.syncInProgress = true;
  const ftpClient = await match(await createFTPClient(applicationState.config))
    .with({ type: "Ok", data: select() }, (res) => Promise.resolve(res))
    .with({ type: "ConnectionError", message: select() }, async (err) => {
      communication.dispatch({
        channel: "log",
        content: `FTP Connection error: ${err}"`,
      });
      return Promise.reject(void 0);
    })
    .exhaustive();

  if (ftpClient === void 0) {
    applicationState.syncInProgress = false;
    communication.dispatch({ channel: "log", content: `Could not sync.` });
    return;
  }

  communication.dispatch({ channel: "log", content: `Attempting to sync.` });
  for (const syncMap of applicationState.config.syncMaps) {
    await sync(syncMap, ftpClient, applicationState.config);
  }
  communication.dispatch({ channel: "log", content: `Sync done!` });
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

    communication.dispatch({
      channel: "log",
      content: `AutoSync enabled! Interval is ${interval} minutes.`,
    });

    applicationState.autoSyncIntervalHandler = setInterval(
      () => syncFiles(applicationState),
      interval * 60 * 1000
    );
  } else {
    communication.dispatch({ channel: "log", content: "AutoSync disabled!" });
  }
}

function getFileMatchesMap(
  dir: FileInfo[],
  syncMap: SyncMap,
  config: Config
): FileMatchesMap {
  const fileMatchesMap: FileMatchesMap = {};

  for (const listingElement of dir) {
    const template = Handlebars.compile(syncMap.fileRenameTemplate);
    const match = listingElement.name.match(syncMap.fileRegex);
    if (!match) {
      if (config.debugFileNames) {
        communication.dispatch({
          channel: "log",
          content: `File did not match regex "${listingElement.name}". Not loading.`,
        });
      }
      continue;
    }

    const templateData: { [key: string]: string } = {
      $syncName: syncMap.id,
    };
    for (let i = 0; i < match.length; i++) {
      templateData["$" + i] = match[i];
    }

    const newName = template(templateData);
    const remoteFile = `${syncMap.originFolder}/${listingElement.name}`;
    const localFile = `${syncMap.destinationFolder}/${newName}`;

    if (!fileMatchesMap[localFile]) {
      fileMatchesMap[localFile] = {
        fileStatOnDisk: null,
        remoteFilesMatching: [],
      };
    }

    fileMatchesMap[localFile].remoteFilesMatching.push({
      path: remoteFile,
      listingElement,
    });

    if (fs.existsSync(localFile)) {
      fileMatchesMap[localFile].fileStatOnDisk = fs.statSync(localFile);
    }
  }

  return fileMatchesMap;
}

async function sync(syncMap: SyncMap, ftpClient: FTP, config: Config) {
  if (!createLocalFolder(syncMap.destinationFolder).exists) {
    return;
  }

  try {
    const dir = await ftpClient.listDir(syncMap.originFolder);
    const fileMatchesMap = getFileMatchesMap(dir, syncMap, config);

    for (const [localFile, fileMatches] of Object.entries(fileMatchesMap)) {
      const latestRemoteMatch = getLatestMatchingFile(fileMatches);

      if (config.debugFileNames) {
        communication.log(`Renaming ${latestRemoteMatch.path} -> ${localFile}`);
      }

      if (fileMatches.fileStatOnDisk) {
        if (
          fileMatches.fileStatOnDisk.size ==
          latestRemoteMatch.listingElement.size
        ) {
          continue;
        } else {
          communication.log(
            `New version or damaged file detected, reloading ${localFile}`
          );
        }
      } else {
        communication.log(`New episode detected, loading ${localFile} now.`);
      }

      await ftpClient.getFile(
        latestRemoteMatch.path,
        localFile,
        latestRemoteMatch.listingElement.size
      );
    }
  } catch (e) {
    if (e instanceof Error) {
      if ("code" in e) {
        const error = e as { code: number };
        if (error.code == 550) {
          communication.dispatch({
            channel: "log",
            content: `Directory "${syncMap.originFolder}" does not exist on remote.`,
          });
        }
      } else {
        communication.dispatch({
          channel: "log",
          content: `Unknown error ${e.message}`,
        });
      }
    } else {
      communication.dispatch({ channel: "log", content: `Unknown error ${e}` });
    }
  }
}

interface RemoteFileMatching {
  path: string;
  listingElement: FileInfo;
}

interface FileMatchesMapEntry {
  fileStatOnDisk: Stats | null;
  remoteFilesMatching: RemoteFileMatching[];
}

interface FileMatchesMap {
  [localFile: string]: FileMatchesMapEntry;
}

function getLatestMatchingFile(
  fileMatches: FileMatchesMapEntry
): RemoteFileMatching {
  fileMatches.remoteFilesMatching.sort((a, b) =>
    a.listingElement.date > b.listingElement.date ? -1 : 1
  );

  return fileMatches.remoteFilesMatching[0];
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
        communication.dispatch({
          channel: "log",
          content: `Could not create folder on file system, "${destinationFolder}" is faulty: "${error.message}"`,
        });
      }
    }
  }
  return { exists: false };
}
