import {Communication} from "./communication";
import {setupTemplateHelper} from "./template";
import {waitForCorrectConfig, watchConfigChanges} from "./config";
import {FastifyInstance} from "fastify";
import {syncFiles, toggleAutoSync} from "./sync";
import {hookupCommunicationEvents} from "./hookup-communication";
import {ApplicationState} from "./index";

export async function init(server: FastifyInstance) {
    const communication = new Communication(server.io, server.log);

    const applicationState = await setupApplication(communication);
    toggleAutoSync(applicationState, true);
    communication.config(JSON.parse(JSON.stringify(applicationState.config)));

    watchConfigChanges(applicationState);

    hookupCommunicationEvents(applicationState);
    if (applicationState.config.syncOnStart) {
        try {
            await syncFiles(applicationState);
        } catch (e) {
            server.log.error(e);
        }
    }
}

async function setupApplication(communication: Communication): Promise<ApplicationState> {
    setupTemplateHelper();

    const config = await waitForCorrectConfig(communication);

    return {
        config,
        communication,
        configUpdateInProgress: false,
        syncInProgress: false,
    };
}
