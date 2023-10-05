"use strict";

let hasRefreshed = false;
async function register(api) {
  api.communication.logInfo("Plex media refresh registered.");
}

async function onFilesDownloadSuccess(api, config) {
  await refresh(api, config);
}

async function refresh(api, config) {
  try {
    const axiosInstance = await api.getAxiosInstance();
    await axiosInstance.get(`${config["plex_update_url"]}${config["token"]}`);
    hasRefreshed = true;
    api.communication.logInfo(
      `Plex media server refresh successfully started!`,
    );
  } catch (e) {
    api.communication.logError(
      `Error while trying to refresh media server: ${e.message}`,
    );
  }
}

async function onConfigUpdate(api, config) {
  if (config["run_on_start"] && !hasRefreshed) {
    await refresh(api, config);
  }
}

var index = {
  name: "plex-media-refresh",
  version: "0.1",
  description: "Plugin to tell plex to rescan media files.",
  register,
  onConfigUpdate,
  onFilesDownloadSuccess,
  pluginConfigurationDefinition: [
    { label: "Plugin settings", type: "label" },
    { key: "run_on_start", type: "boolean", default: true },
    { label: "Plex settings", type: "label" },
    {
      key: "plex_update_url",
      type: "text",
      default: "http://IP:PORT/library/sections/all/refresh?X-Plex-Token=",
    },
    {
      key: "token",
      type: "text",
      default: "TOKEN",
    },
  ],
};

module.exports = index;
