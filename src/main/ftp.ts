import Client, { ListingElement } from "ftp";
import { Config } from "./config";
import fs from "fs";
import progress_stream from "progress-stream";
import { communication } from "./communication";

export type CreateFtpClientResult =
  | {
      type: "Ok";
      data: FTP;
    }
  | { type: "ConnectionError"; message: string };

export class FTP {
  constructor(private _client: Client) {}

  listDir(path: string): Promise<ListingElement[]> {
    return new Promise((resolve, reject) => {
      this._client.list(path, (err, listing) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(listing);
      });
    });
  }

  close(): void {
    this._client.end();
  }

  onError(cb: (err: Error) => void): void {
    this._client.on("error", cb);
  }

  getFile(
    hostFilePath: string,
    localFilePath: string,
    size: number
  ): Promise<void> {
    const progress = progress_stream({
      length: size,
      time: 250,
    });

    return new Promise((resolve, reject) => {
      this._client.get(hostFilePath, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        stream.pipe(progress).pipe(fs.createWriteStream(localFilePath));
        progress.on("progress", (data) => {
          communication.dispatch({
            channel: "updateBottomBar",
            content: {
              fileProgress: `${data.percentage.toFixed(2).padStart(6, " ")}%`,
              downloadSpeed: `${(data.speed / 1000 / 1000)
                .toFixed(3)
                .padStart(7, " ")} MB/s`,
            },
          });
        });
        stream.once("close", () => {
          communication.dispatch({
            channel: "updateBottomBar",
            content: {
              fileProgress: "",
              downloadSpeed: "",
            },
          });
          resolve();
        });
        stream.once("error", (err) => {
          reject(err);
        });
      });
    });
  }
}

export function createFTPClient(
  config: Config
): Promise<CreateFtpClientResult> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve, _) => {
    const client = new Client();
    client.on("ready", () => {
      resolve({ type: "Ok", data: new FTP(client) });
    });

    client.on("error", async (e) => {
      resolve({ type: "ConnectionError", message: e.message });
    });

    client.connect({
      host: config.server.host,
      port: config.server.port,
      user: config.server.user,
      password: config.server.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  });
}
