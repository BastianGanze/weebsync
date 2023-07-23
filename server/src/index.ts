import { Config } from "@shared/types";
import Fastify from "fastify";
import process from "process";
import socketIoFastify from "fastify-socket.io";
import staticFastify from "@fastify/static";
import { Communication } from "./communication";
import { join } from "path";
import { init } from "./init";
import { WeebsyncPlugin } from "./plugin-system";

export interface ApplicationState {
  config: Config;
  configUpdateInProgress: boolean;
  syncInProgress: boolean;
  communication: Communication;
  plugins: WeebsyncPlugin[];
  autoSyncIntervalHandler?: NodeJS.Timer;
}

const server = Fastify({
  logger: true,
});
server.register(socketIoFastify, {
  cors: { origin: "*" },
  transports: ["websocket"],
});
server.register(staticFastify, { root: join(__dirname, "client") });

server.get("/", function (req, reply) {
  reply.sendFile("index.html");
});

server
  .listen({
    host: process.env.WEEB_SYNC_SERVER_HOST ?? "0.0.0.0",
    port: process.env.WEEB_SYNC_SERVER_HTTP_PORT
      ? Number(process.env.WEEB_SYNC_SERVER_HTTP_PORT)
      : 42380,
  })
  .then(() => {
    server.ready(async (err) => {
      if (err) throw err;

      await init(server);
    });
  });

export const viteNodeServer = server;
