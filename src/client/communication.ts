import { io, Socket } from "socket.io-client";
import { ServerCommand } from "../shared/types";

export class Communication {
  socket: Socket;

  constructor() {
    this.socket = io();
  }

  send(command: ServerCommand) {
    console.log(command);
  }
}

export const communication = new Communication();
