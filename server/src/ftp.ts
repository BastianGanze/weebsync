import fs from "fs";

import { Communication } from "./communication";
import { FileInfo, Client, FTPResponse } from "basic-ftp";
import { Config } from "@shared/types";

export type CreateFtpClientResult =
  | {
      type: "Ok";
      data: FTP;
    }
  | { type: "ConnectionError"; message: string };

export class FTP {
  private _client = new Client();
  private _busy: boolean = false;
  private _lastAction: Date = new Date();
  constructor(
    private _communication: Communication,
  ) {}

  isBusy(): boolean {
    return this._busy;
  }

  getLastAction(): Date {
    return this._lastAction;
  }

  async connect(config: Config) {
    await this._client.access({
      host: config.server.host,
      user: config.server.user,
      port: config.server.port,
      password: config.server.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  }

  async listDir(path: string): Promise<FileInfo[]> {
    this._busy = true;
    this._lastAction = new Date();
    try {
      const res = await this._client.list(path);
      this._busy = false;
      return res;
    } catch (e) {
      this._busy = false;
      throw e;
    }

  }

  async cd(path: string): Promise<FTPResponse> {
    this._busy = true;
    this._lastAction = new Date();
    try {
      const res = await this._client.cd(path);
      this._busy = false;
      return res;
    } catch (e) {
      this._busy = false;
      throw e;
    }
  }

  close(): void {
    this._client.close();
  }

  isClosed(): boolean {
    return this._client.closed;
  }

  async getFile(
    hostFilePath: string,
    localFileStream: fs.WriteStream,
    size: number,
  ): Promise<void> {
    const interval = 200;
    let bytesWrittenInLastInterval = 0;
    let lastInterval = Date.now();

    localFileStream.on("drain", () => {
      if (Date.now() - lastInterval > interval) {
        this._lastAction = new Date();
        const progress = (localFileStream.bytesWritten / size) * 100;
        const speed =
          (localFileStream.bytesWritten - bytesWrittenInLastInterval) /
          interval;
        this._communication.updateBottomBar({
          fileProgress: `${progress.toFixed(2).padStart(6, " ")}%`,
          downloadSpeed: `${(speed / 1000).toFixed(3).padStart(7, " ")} MB/s`,
        });
        bytesWrittenInLastInterval = localFileStream.bytesWritten;
        lastInterval = Date.now();
      }
    });

    this._busy = true;
    this._lastAction = new Date();
    try {
      await this._client.downloadTo(localFileStream, hostFilePath);
      this._busy = false;
      this._communication.updateBottomBar(
         {
          fileProgress: "",
          downloadSpeed: "",
        },
      );
    } catch (e) {
      this._busy = false;
      this._communication.updateBottomBar({
          fileProgress: "",
          downloadSpeed: "",
        });
      throw e;
    }
  }
}

let ftps: FTP[] = [];
const FTP_CONNECTION_TIMEOUT = 1000 * 60;
setInterval(() => {
  ftps = ftps.filter(ftp => (Date.now() - ftp.getLastAction().getTime()) > FTP_CONNECTION_TIMEOUT );
}, FTP_CONNECTION_TIMEOUT)

export async function getFTPClient(
  config: Config,
  communication: Communication,
): Promise<CreateFtpClientResult> {
  try {
    let ftp = ftps.find(f => !f.isBusy() && !f.isClosed());
    if (!ftp) {
      ftp = new FTP(communication);
      ftps.push(ftp);
      await ftp.connect(config);
    }
    return { type: "Ok", data: ftp };
  } catch (err) {
    return { type: "ConnectionError", message: err };
  }
}
