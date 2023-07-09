import { defineStore } from "pinia";
import {Config, Log} from "@shared/types";
import {reactive, ref} from "vue";
import { useCommunication} from "./communication";
import {match, P} from "ts-pattern";

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
  let config = reactive(createDefaultConfig());
  const configLoaded = ref(false);
  const isSyncing = ref(false);

  communication.dataEvents.sub((event) => {
    match(event)
        .with({type: 'config', content: P.select()}, (configFromServer) => {
          config = configFromServer;
          configLoaded.value = true;
        })
        .with({type: 'log', content: P.select()}, (log) => {
          logs.push(log);
        })
        .with({type: 'logs', content: P.select()}, (logsFromServer) => {
          logs.splice(0, logs.length);
          logs.push(... logsFromServer);
        })
        .with({type: 'syncStatus', isSyncing: P.select()}, (isSyncingStatus) => {
          isSyncing.value = isSyncingStatus;
        })
        .run();
  })

  return { config, configLoaded, logs, isSyncing };
});
