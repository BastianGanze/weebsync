import { io, Socket } from "socket.io-client";
import { DataEvent, ServerCommand } from "@shared/types";
import { SimpleEventDispatcher } from "strongly-typed-events";

export class Communication {
  socket: Socket;
  dataEvents = new SimpleEventDispatcher<DataEvent>();

  constructor() {
    this.socket = io('', {transports: ["websocket"]});
    this.socket.on("dataEvent", (event) => this.dataEvents.dispatch(event));
  }

  send(command: ServerCommand) {
    this.socket.emit("server", command);
  }

  getVersion(cb: (version: string) => void) {
    this.socket.emit("getVersion", {}, cb);
  }

  getLatestVersion(cb: (version: string) => void) {
    this.socket.emit("getLatestVersion", {}, cb);
  }
}

const communication = new Communication();
export const useCommunication = () => communication;
