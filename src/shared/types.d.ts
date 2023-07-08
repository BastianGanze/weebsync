import { FileInfo } from "basic-ftp";

export type CommunicationChannelMessage =
  | { channel: "server"; content: ServerCommand }
  | { channel: "dataUpdate"; content: DataEvent };

export type ServerCommand =
  | { type: "listDir"; path: string }
  | { type: "checkDir"; path: string }
  | { type: "sync" }
  | { type: "config"; content: Config };

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
  | { type: "log"; content: string }
  | { type: "updateBottomBar"; content: BottomBarUpdateEvent }
  | { type: "config"; content: Config };

export interface BottomBarUpdateEvent {
  fileProgress: string;
  downloadSpeed: string;
}
