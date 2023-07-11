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
  constructor(
    private _communication: Communication,
  ) {}

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
    return await this._client.list(path);
  }

  async cd(path: string): Promise<FTPResponse> {
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
        const progress = (localFileStream.bytesWritten / size) * 100;
        const speed =
          (localFileStream.bytesWritten - bytesWrittenInLastInterval) /
          interval;
        this._communication.dispatch({
          type: "updateBottomBar",
          content: {
            fileProgress: `${progress.toFixed(2).padStart(6, " ")}%`,
            downloadSpeed: `${(speed / 1000).toFixed(3).padStart(7, " ")} MB/s`,
          },
        });
        bytesWrittenInLastInterval = localFileStream.bytesWritten;
        lastInterval = Date.now();
      }
    });

    try {
      await this._client.downloadTo(localFileStream, hostFilePath);
      this._communication.dispatch({
        type: "updateBottomBar",
        content: {
          fileProgress: "",
          downloadSpeed: "",
        },
      });
    } catch (e) {
      this._communication.dispatch({
        type: "updateBottomBar",
        content: {
          fileProgress: "",
          downloadSpeed: "",
        },
      });
      throw e;
    }
  }
}

let ftp: FTP;
let timeout: NodeJS.Timeout;

export async function getFTPClient(
  config: Config,
  communication: Communication,
): Promise<CreateFtpClientResult> {
  try {
    if (timeout) {
      clearTimeout(
          timeout
      );
      timeout = setTimeout(() => {ftp.close()}, 1000 * 60);
    }
    if (!ftp || ftp.isClosed()) {
      ftp = new FTP(communication);
      await ftp.connect(config);
    }
    return { type: "Ok", data: ftp };
  } catch (err) {
    if (ftp && !ftp.isClosed()) {
      ftp.close();
    }
    return { type: "ConnectionError", message: err };
  }
}
