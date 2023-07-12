import {match, P} from "ts-pattern";
import {abortSync, syncFiles} from "./sync";
import {checkDir, listDir} from "./actions";
import {saveConfig} from "./config";
import {ApplicationState} from "./index";

export function hookupCommunicationEvents(
    applicationState: ApplicationState
) {
    applicationState.communication.serverCommand.sub((command) => {
        match(command)
            .with({type: "sync"}, () => {
                if (applicationState.syncInProgress) {
                    abortSync();
                } else {
                    syncFiles(applicationState);
                }
            })
            .with(
                {type: "listDir", path: P.select()},
                async (path) => await listDir(path, applicationState),
            )
            .with(
                {type: "checkDir", path: P.select()},
                async (path) => await checkDir(path, applicationState),
            )
            .with({type: "config", content: P.select()}, (config) =>
                saveConfig(config, applicationState.communication),
            )
            .with({type: "getLogs"}, () =>
                applicationState.communication.dispatch({
                    type: 'logs',
                    content: applicationState.communication.logs.getAll().filter(v => v)
                }),
            )
            .with({type: "getConfig"}, () =>
                applicationState.communication.dispatch({type: 'config', content: applicationState.config}),
            )
            .exhaustive();
    });
}
