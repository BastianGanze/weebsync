import { join } from 'path'
import Vue from '@vitejs/plugin-vue'
import type { UserConfig } from 'vite'
import UnpluginVueComponents from 'unplugin-vue-components'
import VitePluginVuetify from 'vite-plugin-vuetify';

const resolve = (dir: string) => join(__dirname, dir)

const config: UserConfig = {
  resolve: {
    alias: {
      '@': resolve('src/client'),
    },
  },
  base: "",
  build: {
    outDir: "build",
    target: 'es2015',
  },
  plugins: [
    Vue(),
    UnpluginVueComponents.vite(),
    VitePluginVuetify()
  ],
  server: {
    port: 8080,
  },
}

export default config
