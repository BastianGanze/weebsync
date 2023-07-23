import { FileInfo as FileInformation } from "basic-ftp";

export type Log = {
  date: string;
  content: string;
  severity: "info" | "warn" | "error" | "debug";
};

export interface PluginInputDefinition {
  key: string;
  type: "number" | "text" | "boolean";
  default: number | string | boolean;
  enableWhen?: {
    key: string;
    is: number | string | boolean;
  };
}

export interface PluginInputLabel {
  label: string;
  type: "label";
}

export interface WeebsyncPluginBaseInfo {
  name: string;
  version: string;
  description: string;
  config: { [key: string]: number | boolean | string };
  pluginConfigurationDefinition: (PluginInputDefinition | PluginInputLabel)[];
}

export interface ServerToClientEvents {
  log: (log: Log) => void;
  updateBottomBar: (content: BottomBarUpdateEvent) => void;
  syncStatus: (syncStatus: boolean) => void;
  config: (config: Config) => void;
}

export interface ClientToServerEvents {
  getLogs: (cb: (logs: Log[]) => void) => void;
  getVersion: (cb: (version: string) => void) => void;
  getLatestVersion: (cb: (version: string) => void) => void;
  getPlugins: (cb: (plugins: WeebsyncPluginBaseInfo[]) => void) => void;
  sendPluginConfig: (
    name: string,
    config: WeebsyncPluginBaseInfo["config"],
  ) => void;
  listDir: (
    path: string,
    cb: (path: string, result: FileInfo[]) => void,
  ) => void;
  checkDir: (path: string, cb: (exists: boolean) => void) => void;
  config: (config: Config) => void;
  getConfig: (cb: (config: Config) => void) => void;
  getSyncStatus: (cb: (syncStatus: boolean) => void) => void;
  sync: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface Config {
  syncOnStart?: boolean;
  autoSyncIntervalInMinutes?: number;
  debugFileNames?: boolean;
  startAsTray?: boolean;
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
  rename: boolean;
}

export type FileInfo = FileInformation;

export interface BottomBarUpdateEvent {
  fileProgress: string;
  downloadSpeed: string;
}
