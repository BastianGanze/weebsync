import {abortSync, syncFiles} from "./sync";
import {saveConfig} from "./config";
import {ApplicationState} from "./index";
import {Config} from "@shared/types";
import {checkDir, listDir} from "./actions";

export function hookupCommunicationEvents(
    applicationState: ApplicationState
) {
    applicationState.communication.connect.sub((socket) => {

        socket.on("getLogs", (cb) => {
            cb(applicationState.communication.logs.getAll().filter(v => v));
        });
        socket.on("getVersion", (cb) => {
            cb(process.env.__APP_VERSION__);
        });
        socket.on("getLatestVersion", (cb) => {
            fetch("https://api.github.com/repos/BastianGanze/weebsync/releases/latest")
                .then((res) => res.json())
                .then((res) => {
                    cb(res.tag_name);
                });
        });
        socket.on("sync", () => {
            if (applicationState.syncInProgress) {
                abortSync();
            } else {
                syncFiles(applicationState);
            }
        });
        socket.on("config", (config: Config) => {
            saveConfig(config, applicationState.communication);
        });
        socket.on("getConfig", (cb) => {
            cb(applicationState.config);
        });
        socket.on("listDir", async (path, cb) => {
            const info = await listDir(path, applicationState);
            if (info) {
                cb(path, info);
            }
        });
        socket.on("checkDir", async (path, cb) => {
            console.log(path);
            cb(await checkDir(path, applicationState));
        });
    })
}
