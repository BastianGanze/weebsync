import { Systray } from "./systray";
import { Config } from "./config";

declare global {
  interface Window {
    api: {
      send: (channel: string, data: string) => void;
      receive: (channel: string, func: (...args: string[]) => void) => void;
    };
  }
}

export interface ApplicationState {
  systray?: Systray;
  config: Config;
  configUpdateInProgress: boolean;
  syncInProgress: boolean;
  autoSyncIntervalHandler?: NodeJS.Timer;
}
