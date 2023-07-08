import { defineStore } from 'pinia'
import {Config} from "../shared/types";
import {reactive, ref} from "vue";

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

export const useUiStore = defineStore('uiStore', () => {
  const logs = reactive([] as string[]);
  const config = ref(createDefaultConfig());
  const configLoaded = ref(false);

  function addLog(log: string) {
    logs.push(log)
  }

  return { config, configLoaded, logs, addLog };
})
