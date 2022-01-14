import { Systray } from "../main/systray";
import { Config } from "../main/config";

export type CommunicationChannels = "log" | "updateBottomBar" | "command";

declare global {
  interface Window {
    api: {
      send: (channel: CommunicationChannels, data: string) => void;
      receive: (
        channel: CommunicationChannels,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        func: (...args: any[]) => void
      ) => void;
    };
  }
}

export type AppCommand = "minimize" | "minimize-to-tray" | "maximize" | "exit";

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
