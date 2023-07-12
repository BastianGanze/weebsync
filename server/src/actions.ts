import {match, P} from "ts-pattern";
import {getFTPClient} from "./ftp";
import {ApplicationState} from "./index";

export async function listDir(path: string, applicationState: ApplicationState) {
    await match(await getFTPClient(applicationState.config, applicationState.communication))
        .with({type: "Ok", data: P.select()}, async (client) => {
            try {
                const result = await client.listDir(path);
                applicationState.communication.dispatch({
                    type: "listDir",
                    path,
                    result,
                });
            } catch (err) {
                applicationState.communication.logError(`FTP Connection error: ${err}"`);
            }
        })
        .with({type: "ConnectionError", message: P.select()}, async (err) => {
            applicationState.communication.logError(`FTP Connection error: ${err}"`);
        })
        .exhaustive();
}

export async function checkDir(path: string, applicationState: ApplicationState) {
    await match(await getFTPClient(applicationState.config, applicationState.communication))
        .with({ type: "Ok", data: P.select() }, async (client) => {
            try {
                await client.cd(path);
                applicationState.communication.dispatch({
                    type: "checkDir",
                    exists: true,
                });
            } catch (err) {
                applicationState.communication.dispatch({
                    type: "checkDir",
                    exists: false,
                });
            }
        })
        .with({ type: "ConnectionError", message: P.select() }, async (err) =>
            applicationState.communication.logError(`FTP Connection error: ${err}"`),
        )
        .exhaustive();
}
