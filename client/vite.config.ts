import { join } from "path";
import Vue from "@vitejs/plugin-vue";
import type { UserConfig } from "vite";
import UnpluginVueComponents from "unplugin-vue-components";
import VitePluginVuetify from "vite-plugin-vuetify";

const resolve = (dir: string) => join(__dirname, dir);

const config: UserConfig = {
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  base: "",
  build: {
    outDir: "build/client",
    target: "es2015",
  },
  plugins: [Vue(), UnpluginVueComponents.vite(), VitePluginVuetify()],
  server: {
    port: 8080,
  },
};

export default config;
