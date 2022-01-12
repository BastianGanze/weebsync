import fs from "fs";
import { match, select } from "ts-pattern";
import chokidar from "chokidar";
import { ui } from "./ui";

const CONFIG_NAME = "weebsync.config.json";
export const PATH_TO_EXECUTABLE: string = (() => {
  const basePath = process.execPath.includes("/")
    ? process.execPath.split("/")
    : process.execPath.split("\\");
  basePath.pop();
  return basePath.join("/");
})();
export const CONFIG_FILE_PATH = `${PATH_TO_EXECUTABLE}/${CONFIG_NAME}`;

export interface Config {
  syncOnStart?: boolean;
  autoSyncIntervalInMinutes?: number;
  server: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  syncMaps: SyncMap[];
}

export interface SyncMap {
  id: string;
  originFolder: string;
  destinationFolder: string;
  fileRegex: string;
  fileRenameTemplate: string;
}

export function createDefaultConfig(): Config {
  return {
    syncOnStart: true,
    autoSyncIntervalInMinutes: 30,
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

export async function waitForCorrectConfig(): Promise<Config> {
  ui.log.write("Loading configuration.");
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const tmpConfig = await loadConfig();
    if (tmpConfig) {
      resolve(tmpConfig);
    } else {
      const watcher = chokidar.watch(CONFIG_FILE_PATH);
      watcher.on("change", async () => {
        const tmpConfig = await loadConfig();
        if (tmpConfig) {
          await watcher.close();
          resolve(tmpConfig);
        }
      });
    }
  });
}

export async function loadConfig(): Promise<Config | undefined> {
  return await match(getConfig())
    .with({ type: "Ok", data: select() }, (res) => Promise.resolve(res))
    .with({ type: "UnknownError" }, async () => {
      ui.log.write("Unknown error happened. :tehe:");
      return Promise.resolve(void 0);
    })
    .with({ type: "WrongConfigError", message: select() }, async (err) => {
      ui.log.write(`Config malformed. "${err}"`);
      return Promise.resolve(void 0);
    })
    .exhaustive();
}

function getConfig(): GetConfigResult {
  try {
    const file = fs.readFileSync(CONFIG_FILE_PATH).toString("utf-8");
    return {
      type: "Ok",
      data: JSON.parse(file) as Config,
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
