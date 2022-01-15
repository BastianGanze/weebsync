import { AppCommand, CommunicationChannelMessage } from "../shared/types";
import { SimpleEventDispatcher } from "strongly-typed-events";
import { ipcMain } from "electron";
import { Config } from "./config";

export class Communication {
  bufferMessagesForFirstLoad: boolean;
  messages: CommunicationChannelMessage[];

  main: {
    dispatch: SimpleEventDispatcher<CommunicationChannelMessage>;
  };

  frontend: {
    command: SimpleEventDispatcher<AppCommand>;
    config: SimpleEventDispatcher<Config>;
  };

  constructor() {
    this.bufferMessagesForFirstLoad = true;
    this.messages = [];
    this.main = {
      dispatch: new SimpleEventDispatcher(),
    };
    this.frontend = {
      command: new SimpleEventDispatcher(),
      config: new SimpleEventDispatcher(),
    };

    ipcMain.on("command", (_, command) => {
      this.frontend.command.dispatch(command);
    });
    ipcMain.on("config", (_, config) => {
      this.frontend.config.dispatch(config);
    });
  }

  dispatch(message: CommunicationChannelMessage): void {
    if (this.bufferMessagesForFirstLoad) {
      this.messages.push(message);
    }
    this.main.dispatch.dispatch(message);
  }

  drainMessageBuffer(): CommunicationChannelMessage[] {
    const messages = this.messages;
    this.messages = [];
    return messages;
  }
}

export const communication = new Communication();
