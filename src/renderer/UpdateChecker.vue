<template>
  <div>
    <v-icon
      title="New Version available!"
      v-if="!showLink && this.version !== latestVersion"
      small
      color="yellow"
      >mdi-alert</v-icon
    >
    <a
      v-if="showLink && this.version !== latestVersion"
      class="text-decoration-none"
      target="_blank"
      href="https://github.com/BastianGanze/weebsync/releases/latest"
      ><v-icon small color="yellow">mdi-alert</v-icon> Click here to download
      newest version.</a
    >
    <span v-if="showLink && this.version === latestVersion"
      >Weebsync is up to date.</span
    >
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class App extends Vue {
  version = "LOADING";
  latestVersion = "LOADING";
  @Prop(Boolean) showLink: boolean = false;

  created() {
    this.latestVersion = window.api.getLatestVersion();
    window.api.getVersion().then((version) => {
      this.version = `v${version}`;
      this.$forceUpdate();
    });
  }
}
</script>
