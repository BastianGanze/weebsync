import { Config } from "./config";
import fs from "fs";

import { communication } from "./communication";
import { FileInfo, Client } from "basic-ftp";

export type CreateFtpClientResult =
  | {
      type: "Ok";
      data: FTP;
    }
  | { type: "ConnectionError"; message: string };

export class FTP {
  constructor(private _client: Client) {}

  async listDir(path: string): Promise<FileInfo[]> {
    return await this._client.list(path);
  }

  close(): void {
    this._client.close();
  }

  async getFile(
    hostFilePath: string,
    localFilePath: string,
    size: number
  ): Promise<void> {
    const localFileStream = fs.createWriteStream(localFilePath);
    const interval = 200;
    let bytesWrittenInLastInterval = 0;
    let lastInterval = Date.now();

    localFileStream.on("drain", () => {
      if (Date.now() - lastInterval > interval) {
        const progress = (localFileStream.bytesWritten / size) * 100;
        const speed =
          (localFileStream.bytesWritten - bytesWrittenInLastInterval) /
          interval;
        communication.dispatch({
          channel: "updateBottomBar",
          content: {
            fileProgress: `${progress.toFixed(2).padStart(6, " ")}%`,
            downloadSpeed: `${(speed / 1000).toFixed(3).padStart(7, " ")} MB/s`,
          },
        });
        bytesWrittenInLastInterval = localFileStream.bytesWritten;
        lastInterval = Date.now();
      }
    });

    await this._client.downloadTo(localFileStream, hostFilePath);
    communication.dispatch({
      channel: "updateBottomBar",
      content: {
        fileProgress: "",
        downloadSpeed: "",
      },
    });
  }
}

export async function createFTPClient(
  config: Config
): Promise<CreateFtpClientResult> {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: config.server.host,
      user: config.server.user,
      port: config.server.port,
      password: config.server.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
    return { type: "Ok", data: new FTP(client) };
  } catch (err) {
    client.close();
    return { type: "ConnectionError", message: err };
  }
}
