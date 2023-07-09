import { DataEvent, Log, ServerCommand } from "@shared/types";
import { Server, Socket } from "socket.io";
import { SimpleEventDispatcher } from "strongly-typed-events";
import { RingBuffer } from "./ring-buffer";
import {FastifyInstance} from "fastify";
import {match} from "ts-pattern";

export class Communication {
  logs = new RingBuffer<Log>();
  serverCommand = new SimpleEventDispatcher<ServerCommand>();
  socket: Socket | undefined;

  constructor(public io: Server, private _logger: FastifyInstance['log']) {
    io.on("connect", (socket) => {
      socket.on("server", (event) => {
        this.serverCommand.dispatch(event as ServerCommand);
      });
      this.socket = socket;
      this.socket.on("disconnect", () => {
        delete this.socket;
      });
    });
  }

  logInfo(content: string) {
    this.log(content, "info");
  }

  logWarning(content: string) {
    this.log(content, "warn");
  }

  logDebug(content: string) {
    this.log(content, "debug");
  }

  logError(content: string) {
    this.log(content, "error");
  }

  log(content: string, severity: Log["severity"]) {
    const log = { content, severity, date: new Date().toISOString() };
    this.logs.push(log);
    match(severity)
        .with('debug', () => this._logger.debug(log))
        .with('info', () => this._logger.info(log))
        .with('error', () => this._logger.error(log))
        .with('warn', () => this._logger.warn(log))
        .exhaustive();
    this.dispatch({ type: "log", content: log });
  }

  dispatch(dataEvent: DataEvent): void {
    if (!this.socket) {
      return;
    }
    this.socket.emit("dataEvent", dataEvent);
  }
}
