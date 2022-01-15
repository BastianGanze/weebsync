import Vue from "vue";
import Vuetify from "vuetify";
import { UserVuetifyPreset } from "vuetify/types/services/presets";

Vue.use(Vuetify);

const opts: Partial<UserVuetifyPreset> = {
  theme: {
    dark: true,
    options: { cspNonce: "dQw4w9WgXcQ" },
    themes: {
      dark: {
        primary: "#ffffff",
      },
    },
  },
};

export default new Vuetify(opts);
