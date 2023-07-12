import "@mdi/font/css/materialdesignicons.css";
import { createVuetify, VuetifyOptions } from "vuetify";
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

const opts: Partial<VuetifyOptions> = {
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: "#ffffff",
        },
      },
    },
  },
};

export default createVuetify(opts);
