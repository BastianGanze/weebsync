let initialSyncHappened = false;
async function register(api) {
  api.communication.logInfo("Plex media refresh registered.");
}

async function onSyncSuccess(api, config) {
  await refresh(api, config);
}

async function refresh(api, config) {
  const axiosInstance = await api.getAxiosInstance();
  axiosInstance.get(`${config["plex_update_url"]}${config["token"]}`);
}

async function onConfigUpdate(api, config) {
  if (config["run_on_start"] && !initialSyncHappened) {
    api.communication.logInfo("Trying first plex media refresh on startup.");
    console.log(api);
    await refresh(api, config);
    initialSyncHappened = true;
    api.communication.logInfo("Plex media refresh success!");
  }
}

export default {
  name: "plex-media-refresh",
  version: "0.1",
  description: "Plugin to tell plex to rescan media files.",
  register,
  onConfigUpdate,
  onSyncSuccess,
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
