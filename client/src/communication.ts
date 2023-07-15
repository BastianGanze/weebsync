import { io, Socket } from "socket.io-client";
import {ClientToServerEvents, Config, FileInfo, Log, ServerToClientEvents} from "@shared/types";

export class Communication {
  public socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor() {
    this.socket = io('', {transports: ["websocket"]});
  }

  getVersion(cb: (version: string) => void) {
    this.socket.emit("getVersion", cb);
  }

  getLatestVersion(cb: (version: string) => void) {
    this.socket.emit("getLatestVersion", cb);
  }

  getLogs(cb: (logs: Log[]) => void) {
    this.socket.emit("getLogs", cb);
  }

  listDir(path: string, cb: (path: string, result: FileInfo[]) => void) {
    this.socket.emit("listDir", path, cb);
  }

  checkDir(path: string, cb: (exists: boolean) => void) {
    this.socket.emit("checkDir", path, cb);
  }

  config(config: Config) {
    this.socket.emit("config", config);
  }

  getConfig(cb: (config: Config) => void) {
    this.socket.emit("getConfig", cb);
  }

  sync() {
    this.socket.emit("sync");
  }
}

const communication = new Communication();
export const useCommunication = () => communication;
