import { defineStore } from "pinia";
import {BottomBarUpdateEvent, Config, Log} from "@shared/types";
import {reactive, ref} from "vue";
import { useCommunication} from "./communication";

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

export const useUiStore = defineStore("uiStore", () => {
  const communication = useCommunication();

  const logs = reactive([] as Log[]);
  let config = ref(createDefaultConfig());
  const configLoaded = ref(false);
  const isSyncing = ref(false);
  const currentVersion = ref("LOADING");
  const latestVersion = ref("LOADING");
  const bottomBar = ref<BottomBarUpdateEvent>({fileProgress: '', downloadSpeed: ''});

  communication.getVersion(v => {
      currentVersion.value = v;
  });

    communication.getLatestVersion(v => {
        latestVersion.value = v;
    });

    communication.getLogs((logsFromServer) => {
        logs.splice(0, logs.length);
        logs.push(... logsFromServer);
    });

    communication.getConfig((configFromServer) => {
        config.value = configFromServer;
        configLoaded.value = true;
    });

    communication.getSyncSatus((syncStatusFromServer) => {
        isSyncing.value = syncStatusFromServer;
    });

    communication.socket.on("log", (log) => {
        logs.push(log);
    });

    communication.socket.on("config", (configFromServer) => {
        config.value = configFromServer;
    });

    communication.socket.on("updateBottomBar", (bottomBarEvent) => {
        bottomBar.value = bottomBarEvent;
    });

    communication.socket.on("syncStatus", (isSyncingStatus) => {
        isSyncing.value = isSyncingStatus;
    });

  return { config, configLoaded, logs, isSyncing, currentVersion, latestVersion, bottomBar };
});
