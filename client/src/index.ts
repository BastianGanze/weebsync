import { createApp, h } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import { pinia } from "./plugins/pinia";
import PerfectScrollbar from "vue3-perfect-scrollbar";
import Vue3linkify from "vue-3-linkify";

createApp({
  render: () => h(App),
})
  .use(pinia)
  .use(vuetify)
  .use(PerfectScrollbar)
  .use(Vue3linkify)
  .mount("#app");
