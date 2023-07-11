import fs from "fs";
import { match, P } from "ts-pattern";
import chokidar from "chokidar";
import { Config } from "@shared/types";
import { ApplicationState } from "./index";
import {Communication} from "./communication";

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG_NAME = "weebsync.config.json";
export const PATH_TO_EXECUTABLE: string = process.env.INIT_CWD
  ? process.env.INIT_CWD
  : __dirname;
export const CONFIG_FILE_PATH = `${PATH_TO_EXECUTABLE}/config/${CONFIG_NAME}`;

export function watchConfigChanges(applicationState: ApplicationState): void {
  const configWatcher = chokidar.watch(CONFIG_FILE_PATH);
  configWatcher.on("change", async (oath) => {
    if (applicationState.configUpdateInProgress) {
      return;
    }

    applicationState.communication.logInfo(`"${oath}" changed, trying to update configuration.`);
    applicationState.configUpdateInProgress = true;
    if (applicationState.syncInProgress) {
      applicationState.communication.logInfo(
        "Sync is in progress, won't update configuration now.",
      );
      applicationState.configUpdateInProgress = false;
      return;
    }
    const tmpConfig = loadConfig(applicationState.communication);
    if (tmpConfig) {
      applicationState.config = tmpConfig;
      applicationState.communication.logInfo("Config successfully updated.");
      applicationState.communication.dispatch({
        type: "config",
        content: JSON.parse(JSON.stringify(tmpConfig)),
      });
    } else {
      applicationState.communication.logError(
        "Config was broken, will keep the old config for now.",
      );
    }
    applicationState.configUpdateInProgress = false;
  });
}

export function createDefaultConfig(): Config {
  return {
    syncOnStart: true,
    autoSyncIntervalInMinutes: 30,
    debugFileNames: false,
    startAsTray: false,
    server: {
      host: "",
      password: "",
      port: 21,
      user: "",
    },
    syncMaps: [],
  };
}

export type GetConfigResult =
  | {
      type: "Ok";
      data: Config;
    }
  | { type: "WrongConfigError"; message: string }
  | { type: "UnknownError" };

export async function waitForCorrectConfig(communication: Communication): Promise<Config> {
  communication.logInfo("Loading configuration.");
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpConfig = loadConfig(communication);
    if (tmpConfig) {
      resolve(tmpConfig);
    } else {
      const watcher = chokidar.watch(CONFIG_FILE_PATH);
      watcher.on("change", async () => {
        const tmpConfig = loadConfig(communication);
        if (tmpConfig) {
          await watcher.close();
          resolve(tmpConfig);
        }
      });
    }
  });
}

export function loadConfig(communication: Communication): Config | undefined {
  return match(getConfig())
    .with({ type: "Ok", data: P.select() }, (res) => {
      const config = { ...res };
      for (const sync of config.syncMaps) {
        if (sync.rename === undefined) {
          sync.rename =
            sync.fileRegex.length > 0 || sync.fileRenameTemplate.length > 0;
        }
      }
      return config;
    })
    .with({ type: "UnknownError" }, () => {
      communication.logError("Unknown error happened. :tehe:");
      return void 0;
    })
    .with({ type: "WrongConfigError", message: P.select() }, (err) => {
      communication.logError(`Config malformed. "${err}"`);
      return void 0;
    })
    .exhaustive();
}

export function saveConfig(config: Config, communication: Communication): void {
  try {
    for (const sync of config.syncMaps) {
      sync.destinationFolder = sync.destinationFolder.replaceAll("\\", "/");
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 4));
  } catch (e) {
    if (e instanceof Error) {
      communication.logError(`Error while saving config!: ${e.message}`);
    }
  }
}

function getConfig(): GetConfigResult {
  try {
    const file = fs.readFileSync(CONFIG_FILE_PATH).toString("utf-8");
    const config = JSON.parse(file) as Config;

    return {
      type: "Ok",
      data: config,
    };
  } catch (e) {
    if (e) {
      if (e instanceof Error) {
        if ("code" in (e as NodeJS.ErrnoException)) {
          const result = (e as NodeJS.ErrnoException).code;
          if (result === "ENOENT") {
            const config = createDefaultConfig();
            fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 4));
            return { type: "Ok", data: config };
          }
        } else {
          return { type: "WrongConfigError", message: e.message };
        }
      }
    }
  }
  return { type: "UnknownError" };
}
