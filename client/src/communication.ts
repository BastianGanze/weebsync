import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  Config,
  FileInfo,
  Log,
  ServerToClientEvents,
  WeebsyncPluginBaseInfo,
} from "@shared/types";

export class Communication {
  public socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor() {
    // eslint-disable-next-line no-undef
    this.socket = io(__HOST__, { transports: ["websocket"] });
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

  getPlugins(cb: (plugins: WeebsyncPluginBaseInfo[]) => void) {
    this.socket.emit("getPlugins", cb);
  }

  sendPluginConfig(
    name: string,
    pluginConfig: WeebsyncPluginBaseInfo["config"],
  ) {
    this.socket.emit("sendPluginConfig", name, pluginConfig);
  }

  getSyncSatus(cb: (syncStatus: boolean) => void) {
    this.socket.emit("getSyncStatus", cb);
  }
  sync() {
    this.socket.emit("sync");
  }
}

const communication = new Communication();
export const useCommunication = () => communication;
