<template>
  <div class="main-app">
    <div class="title-bar">
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('minimize-to-tray')"
        ><v-img contain max-height="1" src="Tray.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('minimize')"
        ><v-img contain max-height="1" src="Minimieren.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('maximize')"
        ><v-img contain max-height="10" src="Maximieren.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button title-bar__button-exit"
        @click="sendCommand('exit')"
        ><v-img contain max-height="11" src="Schließen.png"
      /></v-btn>
    </div>
    <div class="content-container">
      <v-tabs
        class="app-tabs"
        v-model="tab"
        hide-slider
        background-color="transparent"
        dark
      >
        <v-tab class="app-tabs__tab-item" href="#tab-1">Console</v-tab>
        <v-tab class="app-tabs__tab-item" href="#tab-2">Config</v-tab>
      </v-tabs>
      <v-tabs-items class="app-tabs-content" v-model="tab">
        <v-tab-item class="app-tabs-content__tab-content" :value="'tab-1'"
          ><perfect-scrollbar class="log">
            <div class="log-item" v-for="log in logMessages">{{ log }}</div>
          </perfect-scrollbar></v-tab-item
        >
        <v-tab-item class="app-tabs-content__tab-content" :value="'tab-2'"
          ><perfect-scrollbar class="config">
            <div>Coming soon.</div>
          </perfect-scrollbar></v-tab-item
        >
      </v-tabs-items>
    </div>
    <div class="bottom-bar">
      <div class="bottom-bar__file-progress">{{ fileProgress }}</div>
      <div class="bottom-bar__download-speed">{{ downloadSpeed }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppCommand, BottomBarUpdateEvent } from "../shared/types";

@Component({})
export default class App extends Vue {
  logMessages: string[];
  fileProgress: string;
  downloadSpeed: string;
  tab: null;

  constructor() {
    super();
    this.tab = null;
    this.logMessages = [];
    this.fileProgress = "";
    this.downloadSpeed = "";
  }

  created() {
    window.api.receive("log", (data: string) => {
      this.logMessages.push(data);
    });

    window.api.receive("updateBottomBar", (data: BottomBarUpdateEvent) => {
      this.fileProgress = data.fileProgress;
      this.downloadSpeed = data.downloadSpeed;
    });
  }

  sendCommand(command: AppCommand) {
    window.api.send("command", command);
  }
}
</script>

<style scoped lang="scss">
.log,
.config {
  height: 100%;
}

.content-container {
  display: flex;
  flex-flow: column;
  height: auto;
  position: absolute;
  top: 27px;
  left: 5px;
  bottom: 27px;
  right: 5px;
}

.app-tabs::v-deep.v-tabs > .v-tabs-bar {
  background: none;
  height: 30px;
}

.app-tabs {
  flex: 0 1 auto;
  &__tab-item {
    padding: 8px;
    min-width: auto;
    min-height: auto;
    text-transform: none;
    letter-spacing: inherit;
    font-weight: bold;
  }
  &__tab-item::v-deep.v-tab--active {
    background-color: #282a2d;
  }
}

.app-tabs-content {
  &::v-deep .v-window__container {
    height: 100%;
  }
  background-color: #282a2d;
  flex: 1 1 auto;
  padding: 8px 0 0 8px;

  &__tab-content {
    height: 100%;
  }
}

.title-bar {
  background-color: #202225;
  display: flex;
  justify-content: flex-end;
  -webkit-user-select: none;
  -webkit-app-region: drag;
  height: 22px;

  &__button {
    -webkit-app-region: no-drag;
    border-radius: 0;
    height: 22px;
    width: 28px;
    transition: background-color 500ms;
  }

  &__button:hover {
    background-color: #373b42;
  }
  &__button-exit:hover {
    background-color: #ed4245;
  }
}

.bottom-bar {
  background-color: #202225;
  display: flex;
  justify-content: space-between;
  position: absolute;
  box-sizing: border-box;
  bottom: 0;
  font-size: 7.5pt;
  width: 100%;
  padding: 5px;
  height: 22px;

  &__file-progress {
    padding-left: 8px;
  }

  &__download-speed {
    padding-right: 8px;
  }
}
</style>
