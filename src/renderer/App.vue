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
    <perfect-scrollbar class="log">
      <div class="log-item" v-for="log in logMessages">{{ log }}</div>
    </perfect-scrollbar>
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

  constructor() {
    super();
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
.title-bar {
  background-color: #202225;
  display: flex;
  justify-content: flex-end;
  -webkit-user-select: none;
  -webkit-app-region: drag;
  height: 22px;

  &__button {
    -webkit-app-region: no-drag;
    margin: 0 5px 0 0;
    border-radius: 0;
    height: 22px;
    width: 22px;
    transition: background-color 500ms;
  }

  &__button:hover {
    background-color: #373b42;
  }

  &__button-exit:hover {
    background-color: #ed4245;
  }
}

.log {
  max-height: 100%;
  position: absolute;
  background-color: #282a2d;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: 27px 5px 27px 5px;
  padding: 8px 0 0 8px;
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
