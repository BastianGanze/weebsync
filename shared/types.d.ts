import { FileInfo } from "basic-ftp";

export type CommunicationChannelMessage =
  | { channel: "server"; content: ServerCommand }
  | { channel: "dataUpdate"; content: DataEvent };

export type Log = {
    date: string;
    content: string;
    severity: 'info' | 'warn' | 'error' | 'debug'
}

export type ServerCommand =
  | { type: "listDir"; path: string }
  | { type: "checkDir"; path: string }
  | { type: "sync" }
  | { type: "config"; content: Config }
    | { type: "getLogs"; }
    | { type: "getConfig"; };

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

export type DataEvent =
  | {
      type: "listDir";
      path: string;
      result: FileInfo[];
    }
  | {
      type: "checkDir";
      exists: boolean;
    }
  | {
      type: "syncStatus";
      isSyncing: boolean;
    }
  | { type: "log"; content: Log }
    | { type: "logs"; content: Log[] }
  | { type: "updateBottomBar"; content: BottomBarUpdateEvent }
  | { type: "config"; content: Config };

export interface BottomBarUpdateEvent {
  fileProgress: string;
  downloadSpeed: string;
}
