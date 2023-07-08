import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import {pinia} from "./plugins/pinia";

createApp(App).use(pinia).use(vuetify).use(PerfectScrollbar).mount("#app");
