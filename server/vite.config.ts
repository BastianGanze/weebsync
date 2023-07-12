import { join } from "path";
import type { UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePluginNode } from "vite-plugin-node";
const resolve = (dir: string) => join(__dirname, dir);
// @ts-ignore
import {version} from './package.json';

const config: UserConfig = {
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  base: "",
  build: {
    outDir: "../build",
    target: 'esnext',
  },
  plugins: [
    tsconfigPaths(),
    ...VitePluginNode({
      adapter: "fastify",
      appPath: "src/index.ts",
      exportName: "viteNodeServer"
    }),
  ],
  server: {
    port: 8081,
  },
  define: {
    __APP_VERSION__: `v${version}`,
  }
};

export default config;
