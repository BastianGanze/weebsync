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
  constructor(
    private _client: Client,
    private _communication: Communication,
  ) {}

  async listDir(path: string): Promise<FileInfo[]> {
    return await this._client.list(path);
  }

  async cd(path: string): Promise<FTPResponse> {
    return await this._client.cd(path);
  }

  close(): void {
    this._client.close();
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

export async function createFTPClient(
  config: Config,
  communication: Communication,
): Promise<CreateFtpClientResult> {
  const client = new Client();
  //client.ftp.verbose = true;

  try {
    await client.access({
      host: config.server.host,
      user: config.server.user,
      port: config.server.port,
      password: config.server.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
    return { type: "Ok", data: new FTP(client, communication) };
  } catch (err) {
    client.close();
    return { type: "ConnectionError", message: err };
  }
}
