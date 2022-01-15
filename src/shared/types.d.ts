import { Systray } from "../main/systray";
import { Config } from "../main/config";

export type CommunicationChannelMessage =
  | { channel: "log"; content: string }
  | { channel: "updateBottomBar"; content: BottomBarUpdateEvent }
  | { channel: "command"; content: void }
  | { channel: "config"; content: Config };

type ItemExtractor<Match extends CommunicationChannelMessage["channel"]> =
  Extract<CommunicationChannelMessage, { channel: Match }>;

declare global {
  interface Window {
    api: {
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
      ): void;
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
