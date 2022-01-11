import fs from "fs";
import { match, select } from "ts-pattern";
import { showErrorAndExit } from "./utils";

const CONFIG_NAME = "weebsync.config.json";

export const PATH_TO_EXECUTABLE: string = (() => {
  const basePath = process.execPath.includes("/")
    ? process.execPath.split("/")
    : process.execPath.split("\\");
  basePath.pop();
  return basePath.join("/");
})();

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

export async function getConfigOrExit(): Promise<Config> {
  return (await match(getConfig())
    .with({ type: "Ok", data: select() }, (res) => Promise.resolve(res))
    .with({ type: "UnknownError" }, async () => {
      await showErrorAndExit("Unknown error happened. :tehe:");
    })
    .with({ type: "WrongConfigError", message: select() }, async (err) => {
      await showErrorAndExit(`Config malformed. "${err}"`);
    })
    .exhaustive()) as Config;
}

function getConfig(): GetConfigResult {
  const configPath = `${PATH_TO_EXECUTABLE}/${CONFIG_NAME}`;
  try {
    return {
      type: "Ok",
      data: JSON.parse(fs.readFileSync(configPath).toString("utf-8")) as Config,
    };
  } catch (e) {
    if (e) {
      if (e instanceof Error) {
        if ("code" in (e as NodeJS.ErrnoException)) {
          const result = (e as NodeJS.ErrnoException).code;
          if (result === "ENOENT") {
            const config = createDefaultConfig();
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
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
