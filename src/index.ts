import {Config, getConfig} from "./config";
import {match, select} from "ts-pattern";
import {createFTPClient, FTP} from "./ftp";
import fs from "fs";
import ErrnoException = NodeJS.ErrnoException;
import Handlebars from "handlebars";
import {ui} from "./ui";

export async function showErrorAndExit(msg: string) {
  ui.updateBottomBar(msg);
  await new Promise(resolve => setTimeout(resolve, 20000));
  process.exit(1);
}

Handlebars.registerHelper("renumber", function(num1: string, num2: number, padding: number | unknown) {
  const pad = typeof padding == 'number' ? padding : 2;
  return (Number(num1) - num2).toString().padStart(pad, '0');
});

async function run() {
  const config = await match(getConfig())
    .with({type: 'Ok', data: select()}, (res) => Promise.resolve(res))
    .with({type: 'UnknownError'}, async () => {await showErrorAndExit("Unknown error happened. :tehe:");})
    .with({type: 'WrongConfigError', message: select()}, async (err) => {
      await showErrorAndExit(`Config malformed. "${err}"`);
    })
    .exhaustive() as Config;

  const ftpClient = await match(await createFTPClient(config))
    .with({type: 'Ok', data: select()}, (res) => Promise.resolve(res))
    .with({type: 'ConnectionError', message: select()}, async (err) => {await showErrorAndExit(`FTP Connection error: ${err}"`);})
    .exhaustive() as FTP;

  ftpClient.onError(async (err) => {
    await showErrorAndExit(`FTP Connection error: ${err}"`)
  });

  for (const syncMap of config.syncMaps) {
    try {
      if (!fs.existsSync(syncMap.destinationFolder)){
        fs.mkdirSync(syncMap.destinationFolder, { recursive: true });
      }
    } catch (e) {
      if (e instanceof Error) {
        if ("code" in e) {
          const error = e as ErrnoException;
          await showErrorAndExit(`Could not create folder on file system, "${syncMap.destinationFolder}" is faulty: "${error.message}"`);
        }
      }
    }

    try {
      const dir = await ftpClient.listDir(syncMap.originFolder);
      for (const item of dir) {
        const template = Handlebars.compile(syncMap.fileRenameTemplate);
        const match = item.name.match(syncMap.fileRegex);
        const templateData: {[key: string]: string} = {};
        if (match) {
          for (let i = 0; i < match.length; i++) {
            templateData['$'+i] = match[i];
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
            ui.log.write(`Episode ${newName} already existed but didn't load correctly, attempting to reload now.`);
            await ftpClient.getFile(remoteFile, localFile, item.size);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        if ("code" in e) {
          const error = e as { code: number };
          if (error.code == 550) {
            await showErrorAndExit(`Directory "${syncMap.originFolder}" does not exist on remote.`);
          }
        } else {
          console.error(e);
        }
      } else {
        console.error(e);
      }
    }
  }

  ui.log.write("Everything up to date");
  process.exit(0);
}

run();
