import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import PerfectScrollbar from "vue2-perfect-scrollbar";

Vue.use(PerfectScrollbar);

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
