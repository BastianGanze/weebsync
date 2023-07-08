import { ServerCommand, CommunicationChannelMessage } from "../shared/types";
import { SimpleEventDispatcher } from "strongly-typed-events";
import { Config } from "./config";
import process from "process";
import {Server} from "socket.io";

export class Communication {
  bufferMessagesForFirstLoad: boolean;
  messages: CommunicationChannelMessage[];
  io: Server;

  main: {
    dispatch: SimpleEventDispatcher<CommunicationChannelMessage>;
  };

  frontend: {
    command: SimpleEventDispatcher<ServerCommand>;
    config: SimpleEventDispatcher<Config>;
  };

  constructor() {
    this.io = new Server();
    this.io.listen(process.env.WEEB_SYNC_SERVER_WS_PORT ? Number(process.env.WEEB_SYNC_SERVER_WS_PORT) : 42300);

    this.bufferMessagesForFirstLoad = true;
    this.messages = [];
    this.main = {
      dispatch: new SimpleEventDispatcher(),
    };
    this.frontend = {
      command: new SimpleEventDispatcher(),
      config: new SimpleEventDispatcher(),
    };
  }

  log(content: string): void {
    this.dispatch({
      channel: "log",
      content,
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
