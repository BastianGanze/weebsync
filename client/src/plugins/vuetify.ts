import "@mdi/font/css/materialdesignicons.css";
import { createVuetify, VuetifyOptions } from "vuetify";

const opts: Partial<VuetifyOptions> = {
  icons: {
    defaultSet: "mdiSvg",
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
