import {
  BottomBarUpdateEvent,
  ClientToServerEvents,
  Config,
  InterServerEvents,
  Log,
  ServerToClientEvents,
} from "@shared/types";
import { Server, Socket } from "socket.io";
import { RingBuffer } from "./ring-buffer";
import { FastifyInstance } from "fastify";
import { match } from "ts-pattern";
import { SimpleEventDispatcher } from "strongly-typed-events";

export class Communication {
  private _socket:
    | Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents>
    | undefined;

  logs = new RingBuffer<Log>();
  connect = new SimpleEventDispatcher<typeof this._socket>();

  constructor(
    public io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents
    >,
    private _logger: FastifyInstance["log"],
  ) {
    io.on("connect", (socket) => {
      this._socket = socket;
      this._socket.on("disconnect", () => {
        delete this._socket;
      });
      this.connect.dispatch(socket);
    });
  }

  sendSyncStatus(status: boolean) {
    if (this._socket) {
      this._socket.emit("syncStatus", status);
    }
  }

  updateBottomBar(updateBottomBarEvent: BottomBarUpdateEvent) {
    if (this._socket) {
      this._socket.emit("updateBottomBar", updateBottomBarEvent);
    }
  }

  sendConfig(config: Config) {
    if (this._socket) {
      this._socket.emit("config", config);
    }
  }

  logInfo(content: string) {
    this._log(content, "info");
  }

  logWarning(content: string) {
    this._log(content, "warn");
  }

  logDebug(content: string) {
    this._log(content, "debug");
  }

  logError(content: string) {
    this._log(content, "error");
  }

  private _log(content: string, severity: Log["severity"]) {
    const log = { content, severity, date: new Date().toISOString() };
    this.logs.push(log);
    match(severity)
      .with("debug", () => this._logger.debug(log))
      .with("info", () => this._logger.info(log))
      .with("error", () => this._logger.error(log))
      .with("warn", () => this._logger.warn(log))
      .exhaustive();
    if (this._socket) {
      this._socket.emit("log", log);
    }
  }
}
