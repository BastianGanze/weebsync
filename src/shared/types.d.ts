import { Systray } from "../main/systray";
import { Config } from "../main/config";
import { FileInfo } from "basic-ftp";

export type CommunicationChannelMessage =
  | { channel: "log"; content: string }
  | { channel: "updateBottomBar"; content: BottomBarUpdateEvent }
  | { channel: "command"; content: AppCommand }
  | { channel: "command-result"; content: AppCommandResult }
  | { channel: "config"; content: Config };

type ItemExtractor<Match extends CommunicationChannelMessage["channel"]> =
  Extract<CommunicationChannelMessage, { channel: Match }>;

export type IpcListener = (
  event: Electron.IpcRendererEvent,
  ...args: never[]
) => void;

declare global {
  interface Window {
    api: {
      getVersion(): Promise<string>;
      getLatestVersion(): string;
      send<
        K extends CommunicationChannelMessage["channel"],
        T = ItemExtractor<K>["content"]
      >(
        channel: K,
        content: T
      ): void;
      receive<
        K extends CommunicationChannelMessage["channel"],
        T = ItemExtractor<K>["content"]
      >(
        channel: K,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        func: (content: T) => void
      ): IpcListener;
      unsub<
        K extends CommunicationChannelMessage["channel"],
        T = ItemExtractor<K>["content"]
      >(
        channel: K,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        func: (content: T) => void
      ): void;
    };
  }
}

export type AppCommand =
  | { type: "minimize" }
  | { type: "minimize-to-tray" }
  | { type: "maximize" }
  | { type: "list-dir"; path: string }
  | { type: "check-dir"; path: string }
  | { type: "exit" }
  | { type: "sync" };

export type AppCommandResult =
  | {
      type: "list-dir";
      path: string;
      result: FileInfo[];
    }
  | {
      type: "check-dir";
      exists: boolean;
    }
  | {
      type: "sync-status";
      isSyncing: boolean;
    };

export interface BottomBarUpdateEvent {
  fileProgress: string;
  downloadSpeed: string;
}

export interface ApplicationState {
  systray?: Systray;
  config: Config;
  configUpdateInProgress: boolean;
  syncInProgress: boolean;
  autoSyncIntervalHandler?: NodeJS.Timer;
}
