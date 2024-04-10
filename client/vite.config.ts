import { join } from "path";
import Vue from "@vitejs/plugin-vue";
import UnpluginVueComponents from "unplugin-vue-components";
import VitePluginVuetify from "vite-plugin-vuetify";
import { defineConfig } from "vite";

const resolve = (dir: string) => join(__dirname, dir);

export default defineConfig(({ command }) => {
  return {
    resolve: {
      alias: {
        "@": resolve("src"),
        "@shared": resolve("../shared"),
      },
    },
    base: "",
    define: {
      __HOST__: command === "serve" ? '"http://0.0.0.0:42380"' : '""',
    },
    build: {
      outDir: "../build/client",
      target: "es2015",
    },
    plugins: [Vue(), UnpluginVueComponents.vite(), VitePluginVuetify()],
    server: {
      port: 8080,
    },
  };
});
