import Client, { ListingElement } from "ftp";
import { Config } from "./config";
import fs from "fs";
import progress_stream from "progress-stream";
import { ui } from "./ui";
import { match, select } from "ts-pattern";
import { showErrorAndExit } from "./utils";

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

  onError(cb: (err: Error) => void) {
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
          ui.updateBottomBar(
            `${data.percentage.toFixed(2).padStart(6, " ")}% - ${(
              data.speed /
              1000 /
              1000
            )
              .toFixed(3)
              .padStart(7, " ")} mB/s`
          );
        });
        stream.once("finish", () => {
          ui.updateBottomBar("");
          resolve();
        });
        stream.on("error", (err) => {
          reject(err);
        });
      });
    });
  }
}

export function createFTPClient(
  config: Config
): Promise<CreateFtpClientResult> {
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
