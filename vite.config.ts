import { defineConfig } from "vite";
import { createVuePlugin } from "vite-plugin-vue2";
import ViteComponents, { VuetifyResolver } from "vite-plugin-components";
import { resolve } from "path";

const config = defineConfig({
  resolve: {
    alias: {
      "@": `${resolve(__dirname, "src")}`,
    },
  },

  base: "",
  build: {
    outDir: "build/renderer",
    minify: true,
  },

  plugins: [
    createVuePlugin({}),
    ViteComponents({
      transformer: "vue2",
      customComponentResolvers: [VuetifyResolver()],
    }),
  ],

  server: {
    port: 8080,
  },
});

export default config;
