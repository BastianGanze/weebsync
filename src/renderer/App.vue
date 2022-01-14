<template>
  <div class="main-app">
    <div class="title-bar">
      <button class="title-bar__button" @click="sendCommand('minimize-to-tray')">Minimize to Tray</button>
      <button class="title-bar__button" @click="sendCommand('minimize')">Minimize</button>
      <button class="title-bar__button" @click="sendCommand('maximize')">Maximize</button>
      <button class="title-bar__button" @click="sendCommand('exit')">Exit</button>
    </div>
    <div class="log">
      <div class="log-item" v-for="log in logMessages">{{log}}</div>
    </div>
    <div class="bottom-bar">
      <div class="bottom-bar__file-progress">{{fileProgress}}</div>
      <div class="bottom-bar__download-speed">{{downloadSpeed}}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {AppCommand, BottomBarUpdateEvent} from "../shared/types";

@Component( {})
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
  background-color: #333333;
  display: flex;
  justify-content: flex-end;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  &__button {
    -webkit-app-region: no-drag;
  }
}

.log {
  max-height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: 20px 0 32px 0;
  padding: 8px 0 0 8px;
  overflow-y: scroll;
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  position: absolute;
  box-sizing: border-box;
  bottom: 0;
  width: 100%;
  padding: 8px;
  border: 1px solid white;
  height: 32px;

  &__file-progress {

  }

  &__download-speed {

  }
}

</style>
