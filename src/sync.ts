import fs from "fs";
import { ui } from "./ui";
import { SyncMap } from "./config";
import { FTP } from "./ftp";
import Handlebars from "handlebars";
import ErrnoException = NodeJS.ErrnoException;

export async function sync(syncMap: SyncMap, ftpClient: FTP) {
  if (!createLocalFolder(syncMap.destinationFolder).created) {
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
      if (!fs.existsSync(localFile)) {
        ui.log.write(`New episode detected, loading ${newName} now.`);
        await ftpClient.getFile(remoteFile, localFile, item.size);
      } else {
        const stat = fs.statSync(localFile);
        if (stat.size != item.size) {
          ui.log.write(
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
          ui.log.write(
            `Directory "${syncMap.originFolder}" does not exist on remote.`
          );
        }
      } else {
        ui.log.write(`Unknown error ${e.message}`);
      }
    } else {
      ui.log.write(`Unknown error ${e}`);
    }
  }
}

function createLocalFolder(destinationFolder: string): { created: boolean } {
  try {
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
      return { created: true };
    }
  } catch (e) {
    if (e instanceof Error) {
      if ("code" in e) {
        const error = e as ErrnoException;
        ui.log.write(
          `Could not create folder on file system, "${destinationFolder}" is faulty: "${error.message}"`
        );
      }
    }
  }
  return { created: false };
}
