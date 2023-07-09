import { saveConfig, waitForCorrectConfig, watchConfigChanges } from "./config";
import { setupTemplateHelper } from "./template";
import { Config } from "@shared/types";
import { abortSync, syncFiles, toggleAutoSync } from "./sync";
import { match, P } from "ts-pattern";
import { createFTPClient } from "./ftp";
import Fastify from "fastify";
import process from "process";
import socketIoFastify from "fastify-socket.io";
import { Communication } from "./communication";
import {join} from "path";
import { readFileSync } from 'fs';

export interface ApplicationState {
  config: Config;
  configUpdateInProgress: boolean;
  syncInProgress: boolean;
  communication: Communication;
  autoSyncIntervalHandler?: NodeJS.Timer;
}

const server = Fastify({
  logger: true,
});
server.register(socketIoFastify, {cors: {origin: '*'}, transports: ["websocket"]});
server.get('/', async (req, reply) => {
  try {
    const data = readFileSync(join(__dirname, '..', 'index.html'));
  reply.header('content-type', 'text/html; charset=utf-8');
  reply.send(data);
  } catch (e) {
    reply.send("test");
  }
})

await server.listen({
  port: process.env.WEEB_SYNC_SERVER_HTTP_PORT
      ? Number(process.env.WEEB_SYNC_SERVER_HTTP_PORT)
      : 42380,
});

server.ready(async (err) => {
  if (err) throw err;

  await init()
})

async function init() {
  const communication = new Communication(server.io, server.log);

  const applicationState = await setupApplication(communication);
  toggleAutoSync(applicationState, true);
  communication.dispatch({
    type: "config",
    content: JSON.parse(JSON.stringify(applicationState.config)),
  });

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

async function listDir(path: string, applicationState: ApplicationState) {
  await match(await createFTPClient(applicationState.config, applicationState.communication))
    .with({ type: "Ok", data: P.select() }, async (client) => {
      try {
        const result = await client.listDir(path);
        client.close();
        applicationState.communication.dispatch({
          type: "listDir",
          path,
          result,
        });
      } catch (err) {
        applicationState.communication.logInfo(`FTP Connection error: ${err}"`);
      }
    })
    .with({ type: "ConnectionError", message: P.select() }, async (err) => {
      applicationState.communication.logError(`FTP Connection error: ${err}"`);
    })
    .exhaustive();
}

async function checkDir(path: string, applicationState: ApplicationState) {
  await match(await createFTPClient(applicationState.config, applicationState.communication))
    .with({ type: "Ok", data: P.select() }, async (client) => {
      try {
        await client.cd(path);
        client.close();
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

function hookupCommunicationEvents(
  applicationState: ApplicationState
) {
  applicationState.communication.serverCommand.sub((command) => {
    match(command)
      .with({ type: "sync" }, () => {
        if (applicationState.syncInProgress) {
          abortSync();
        } else {
          syncFiles(applicationState);
        }
      })
      .with(
        { type: "listDir", path: P.select() },
        async (path) => await listDir(path, applicationState),
      )
      .with(
        { type: "checkDir", path: P.select() },
        async (path) => await checkDir(path, applicationState),
      )
      .with({ type: "config", content: P.select() }, (config) =>
        saveConfig(config, applicationState.communication),
      )
        .with({ type: "getLogs" }, () =>
            applicationState.communication.dispatch({type: 'logs', content: applicationState.communication.logs.getAll().filter(v => v)}),
        )
        .with({ type: "getConfig" }, () =>
            applicationState.communication.dispatch({type: 'config', content: applicationState.config}),
        )
      .exhaustive();
  });
}

export const viteNodeServer = server;
