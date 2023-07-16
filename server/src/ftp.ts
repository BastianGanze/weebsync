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
  private _used = false;
  private _lastAction: Date = new Date();
  constructor(
    private _communication: Communication,
  ) {}

  borrow() {
    if (this._used) {
      throw new Error("Tried to borrow while it was still borrowed?!");
    }
    this._used = true;
  }

  free() {
    if (!this._used) {
      throw new Error("Tried to free while it was already freed?!");
    }
    this._used = false;
  }

  available(): boolean {
    return !this._used;
  }

  getLastActionTime(): number {
    return this._lastAction.getTime();
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
    this._lastAction = new Date();
    return await this._client.list(path);
  }

  async cd(path: string): Promise<FTPResponse> {
    this._lastAction = new Date();
    return await this._client.cd(path);
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

    this._lastAction = new Date();
    try {
      await this._client.downloadTo(localFileStream, hostFilePath);
    } finally {
      this._communication.updateBottomBar(
          {
            fileProgress: "",
            downloadSpeed: "",
          },
      );
    }
  }
}

let ftpConnections: FTP[] = [];
const FTP_CONNECTION_TIMEOUT = 1000 * 60;
setInterval(() => {
  cleanFTPConnections();
}, FTP_CONNECTION_TIMEOUT)

function cleanFTPConnections() {
  ftpConnections = ftpConnections.filter(ftp => {
    if ((Date.now() - ftp.getLastActionTime()) > FTP_CONNECTION_TIMEOUT || ftp.isClosed()) {
      ftp.close();
      return false;
    }
    return true;
  } );
}

export async function getFTPClient(
  config: Config,
  communication: Communication,
): Promise<CreateFtpClientResult> {
  try {
    console.log("---------");
    for (const f of ftpConnections) {
      console.log(`av ${f.available()} - cl ${f.isClosed()}`);
    }
    cleanFTPConnections();
    let freeFtpConnection = ftpConnections.find(f => f.available() && !f.isClosed());
    if (!freeFtpConnection) {
      if (ftpConnections.length >= 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await getFTPClient(config, communication);
      }

      freeFtpConnection = new FTP(communication);
      ftpConnections.push(freeFtpConnection);
      await freeFtpConnection.connect(config);
    }

    freeFtpConnection.borrow();
    return {type: "Ok", data: freeFtpConnection };
  } catch (err) {
    return { type: "ConnectionError", message: err };
  }
}
