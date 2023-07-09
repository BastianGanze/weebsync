import { io, Socket } from "socket.io-client";
import { DataEvent, ServerCommand } from "@shared/types";
import { SimpleEventDispatcher } from "strongly-typed-events";

export class Communication {
  socket: Socket;
  dataEvents = new SimpleEventDispatcher<DataEvent>();

  constructor() {
    this.socket = io('http://localhost:42380', {transports: ["websocket"]});
    this.socket.on("dataEvent", (event) => this.dataEvents.dispatch(event));
  }

  send(command: ServerCommand) {
    this.socket.emit("server", command);
  }
}

const communication = new Communication();
export const useCommunication = () => communication;
