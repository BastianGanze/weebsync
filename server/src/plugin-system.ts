import process from "process";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { ApplicationState } from "./index";
import { createWriteStream, rmSync } from "fs";
import extract from "extract-zip";
import axios from "axios";
import { Communication } from "./communication";
import { WeebsyncPluginBaseInfo } from "@shared/types";
import { CONFIG_FILE_DIR } from "./config";

export const PATH_TO_EXECUTABLE: string = process.cwd()
  ? process.cwd()
  : __dirname;

export const pluginApis: { [name: string]: WeebsyncApi } = {};
export async function initPluginSystem(applicationState: ApplicationState) {
  const pluginDir =
    process.env.WEEB_SYNC_PLUGIN_DIR ?? `${PATH_TO_EXECUTABLE}/plugins`;
  applicationState.communication.logDebug(pluginDir);

  try {
    const pluginFolders = readdirSync(pluginDir);
    applicationState.communication.logInfo(
      `Found ${pluginFolders.length} plugin${
        pluginFolders.length === 0 || pluginFolders.length > 1 ? "s" : ""
      }.`,
    );
    for (const pluginFolder of pluginFolders) {
      try {
        await loadPlugin(pluginDir, pluginFolder, applicationState);
      } catch (e) {
        applicationState.communication.logError(
          `Could not load plugin in folder "${pluginFolder}", reason: ${e.message}`,
        );
      }
    }
  } catch (e) {
    if (e.code && e.code === "ENOENT") {
      return;
    }
    applicationState.communication.logError(
      `Could not setup plugins due to unknown error: "${e.message}"`,
    );
  }
}

export interface WeebsyncPlugin extends WeebsyncPluginBaseInfo {
  register: (api: WeebsyncApi) => Promise<void>;
  onConfigUpdate?: (
    api: WeebsyncApi,
    config: WeebsyncPluginBaseInfo["config"],
  ) => Promise<void>;
}

interface WeebsyncApi {
  applicationState: ApplicationState;
  communication: Communication;
  thisPluginDirectory: string;
  downloadPluginResourceZipAndUnzip: (
    directoryPath: string,
    url: string,
  ) => Promise<void>;
}

async function downloadPluginResourceZipAndUnzip(
  directoryPath: string,
  url: string,
) {
  const tmpZipPath = `${directoryPath}/archive.zip`;
  const file = createWriteStream(tmpZipPath);

  const response = await axios({ method: "GET", url, responseType: "stream" });

  await new Promise((resolve, reject) => {
    response.data.pipe(file);
    file.on("finish", () => {
      file.close(resolve);
    });
    file.on("error", reject);
  });

  await extract(tmpZipPath, { dir: `${directoryPath}` });
  rmSync(tmpZipPath);
}

async function loadOrCreatePluginConfiguration(
  plugin: WeebsyncPlugin,
): Promise<WeebsyncPlugin["config"]> {
  const configFileName = `${plugin.name}-config.json`;
  let pluginConfig: WeebsyncPlugin["config"];
  try {
    pluginConfig = JSON.parse(
      readFileSync(`${CONFIG_FILE_DIR}/${configFileName}`, "utf-8"),
    );
  } catch (e) {
    if (e.code && e.code === "ENOENT") {
      pluginConfig = {};
      for (const def of plugin.pluginConfigurationDefinition) {
        if (def.type === "label") {
          continue;
        }
        pluginConfig[def.key] = def.default;
      }
      await savePluginConfiguration(plugin.name, pluginConfig);
    }
  }

  return pluginConfig;
}

export async function savePluginConfiguration(
  pluginName: string,
  config: WeebsyncPlugin["config"],
) {
  const configFileName = `${pluginName}-config.json`;
  writeFileSync(
    `${CONFIG_FILE_DIR}/${configFileName}`,
    JSON.stringify(config, null, 2),
  );
}
async function loadPlugin(
  pluginDir: string,
  pluginFolder: string,
  applicationState: ApplicationState,
) {
  try {
    const thisPluginDirectory = `${pluginDir}/${pluginFolder}`;
    let plugin: WeebsyncPlugin;
    try {
      plugin = (
        (await import(`${thisPluginDirectory}/index.mjs`)) as {
          default: WeebsyncPlugin;
        }
      ).default;
    } catch (e) {
      applicationState.communication.logWarning(
        "Could not load plugin as .mjs, trying .js now...",
      );
      plugin = (
        (await import(`${thisPluginDirectory}/index.js`)) as {
          default: WeebsyncPlugin;
        }
      ).default;
    }

    pluginApis[plugin.name] = {
      applicationState,
      communication: applicationState.communication,
      downloadPluginResourceZipAndUnzip,
      thisPluginDirectory,
    };
    await plugin.register(pluginApis[plugin.name]);
    plugin.config = await loadOrCreatePluginConfiguration(plugin);
    if (plugin.onConfigUpdate) {
      await plugin.onConfigUpdate(pluginApis[plugin.name], plugin.config);
    }
    applicationState.plugins.push(plugin);
  } catch (e) {
    applicationState.communication.logError(
      `Could not load plugin in dir "${pluginFolder}": ${e.message}`,
    );
  }
}
