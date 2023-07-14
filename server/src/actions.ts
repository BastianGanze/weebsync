import {match, P} from "ts-pattern";
import {getFTPClient} from "./ftp";
import {ApplicationState} from "./index";

export async function listDir(path: string, applicationState: ApplicationState) {
    return await match(await getFTPClient(applicationState.config, applicationState.communication))
        .with({type: "Ok", data: P.select()}, async (client) => {
            try {
                return await client.listDir(path);
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
    return await match(await getFTPClient(applicationState.config, applicationState.communication))
        .with({ type: "Ok", data: P.select() }, async (client) => {
            try {
                await client.cd(path);
                return true;
            } catch (err) {
                return false;
            }
        })
        .with({ type: "ConnectionError", message: P.select() }, async (err) =>
            {
                applicationState.communication.logError(`FTP Connection error: ${err}"`);

                return false;
            }
        )
        .exhaustive();
}
