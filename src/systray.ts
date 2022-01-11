import * as child_process from "child_process";
import fs from "fs";
import { Config, PATH_TO_EXECUTABLE } from "./config";
import path from "path";
import { showErrorAndExit } from "./utils";
import { SimpleEventDispatcher } from "strongly-typed-events";

type SysTrayEvent = {
  type: "clicked";
  item: {
    title: string;
    tooltip: string;
    enabled: boolean;
    checked: boolean;
  };
  seq_id: number;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function getSystrayOrExit(): Promise<Systray> {
  try {
    const systray = new Systray();
    await systray.ready();
    return systray;
  } catch (e) {
    if (e instanceof Error) {
      await showErrorAndExit(
        `Could not create system tray. Reason: ${e.message}`
      );
    }
    await showErrorAndExit(
      `Could not create system tray due to unknown reason: ${e}`
    );
  }
}

function streamCopy(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs
      .createReadStream(source)
      .pipe(fs.createWriteStream(destination));
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}

export class Systray {
  private readonly _readyPromise: Promise<void>;

  public exit: SimpleEventDispatcher<void>;
  public sync: SimpleEventDispatcher<void>;
  public autoSync: SimpleEventDispatcher<boolean>;

  ready(): Promise<void> {
    return this._readyPromise;
  }

  constructor() {
    this.exit = new SimpleEventDispatcher();
    this.sync = new SimpleEventDispatcher();
    this.autoSync = new SimpleEventDispatcher();
    // eslint-disable-next-line no-async-promise-executor
    this._readyPromise = new Promise(async (resolve, reject) => {
      try {
        const platformBinNameMap: { [key: string]: string } = {
          win32: `tray_windows_release.exe`,
          darwin: `tray_darwin_release`,
          linux: `tray_linux_release`,
        };
        const platformLogoMap: { [key: string]: string } = {
          win32: `logo_s.ico`,
          darwin: `logo_s.png`,
          linux: `logo_s.png`,
        };
        const platformSystrayExecutable = platformBinNameMap[process.platform];
        const platformSystrayLogo = platformLogoMap[process.platform];

        const localSystrayPath = `${PATH_TO_EXECUTABLE}/vendor`;
        const assetPath = path.join(__dirname, `../static`);
        if (!fs.existsSync(localSystrayPath)) {
          fs.mkdirSync(localSystrayPath, { recursive: true });
          await streamCopy(
            `${assetPath}/${platformSystrayExecutable}`,
            `${localSystrayPath}/${platformSystrayExecutable}`
          );
        }

        const icon = fs
          .readFileSync(`${assetPath}/${platformSystrayLogo}`, {
            encoding: "base64",
          })
          .toString();

        const tray_process = child_process.spawn(
          `${localSystrayPath}/${platformSystrayExecutable}`
        );
        tray_process.stdout?.on("data", (data) => {
          const event = JSON.parse(data.toString()) as SysTrayEvent;
          if (event.type == "clicked") {
            if (event.item.title == "Exit") {
              this.exit.dispatch();
            }
            if (event.item.title == "Sync") {
              this.sync.dispatch();
            }
            if (event.item.title == "Automatic sync") {
              event.item.checked = !event.item.checked;
              this.autoSync.dispatch(event.item.checked);
              tray_process.stdin.write(
                JSON.stringify({
                  type: "update-item",
                  item: event.item,
                  seq_id: event.seq_id,
                }).trim() + "\n"
              );
            }
          }
        });
        tray_process.stderr?.on("data", (event) => {
          console.error(event.toString());
        });
        tray_process.on("exit", (code) => {
          process.exit(code as number);
        });
        tray_process.on("close", (code) => {
          process.exit(code as number);
        });
        tray_process.on("error", (event) => {
          console.error("message", event);
        });
        tray_process.on("spawn", () => {
          tray_process.stdin.write(
            JSON.stringify(this._systrayConfig(icon)).trim() + "\n"
          );
          this.autoSync.dispatch(true);
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  _systrayConfig(icon: string) {
    return {
      icon,
      title: "weebsync",
      tooltip: "weebsync",
      items: [
        {
          title: "Exit",
          tooltip: "Close weebsync",
          checked: false,
          enabled: true,
        },
        {
          title: "Sync",
          tooltip: "Trigger manual sync",
          checked: false,
          enabled: true,
        },
        {
          title: "Automatic sync",
          tooltip: "Toggle automatic sync",
          checked: true,
          enabled: true,
        },
      ],
    };
  }
}
