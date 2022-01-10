import fs from "fs";

const CONFIG_NAME = 'weebsync.config.json';

export interface Config {
  server: {
    host: string,
    port: number,
    user: string,
    password: string
  },
  syncMaps: SyncMap[]
}

export interface SyncMap {
  id: string,
  originFolder: string,
  destinationFolder: string,
  fileRegex: string,
  fileRenameTemplate: string
}

export function createDefaultConfig(): Config {
  return {
    server: {
      host: '',
      password: '',
      port: 21,
      user: ''
    },
    syncMaps: []
  };
}

export type GetConfigResult = | {
  type: 'Ok'; data: Config} |
  { type: 'WrongConfigError'; message: string } |
  { type: 'UnknownError' };

export function getConfig(): GetConfigResult {
  const basePath = process.execPath.includes('/') ? process.execPath.split('/') : process.execPath.split('\\');
  basePath.pop();
  const configPath = `${basePath.join('/')}/${CONFIG_NAME}`;
  try {
    return {type: 'Ok', data: JSON.parse(fs.readFileSync(configPath).toString('utf-8')) as Config};
  } catch (e) {
    if (e) {
      if (e instanceof Error) {
        if ("code" in (e as NodeJS.ErrnoException)) {
          const result = (e as NodeJS.ErrnoException).code;
          if (result === "ENOENT") {
            let config = createDefaultConfig();
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            return {type: 'Ok', data: config};
          }
        } else {
          return {type: 'WrongConfigError', message: e.message};
        }
      }
    }
  }
  return {type: 'UnknownError'};
}
