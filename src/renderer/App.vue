<template>
  <v-app class="main-app">
    <div class="title-bar">
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('minimize-to-tray')"
        ><v-img
          class="title-bar__button-image"
          contain
          max-height="1"
          src="Tray.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('minimize')"
        ><v-img
          class="title-bar__button-image"
          contain
          max-height="1"
          src="Minimieren.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button"
        @click="sendCommand('maximize')"
        ><v-img
          class="title-bar__button-image"
          contain
          max-height="10"
          src="Maximieren.png"
      /></v-btn>
      <v-btn
        icon
        x-small
        class="title-bar__button title-bar__button-exit"
        @click="sendCommand('exit')"
        ><v-img
          class="title-bar__button-image"
          contain
          max-height="11"
          src="Schließen.png"
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
        <v-tab class="app-tabs__tab-item" href="#tab-3">Sync</v-tab>
      </v-tabs>
      <v-tabs-items class="app-tabs-content" v-model="tab">
        <v-tab-item class="app-tabs-content__tab-content" :value="'tab-1'"
          ><perfect-scrollbar class="log">
            <div class="log-item" v-for="log in logMessages">{{ log }}</div>
          </perfect-scrollbar></v-tab-item
        >
        <v-tab-item class="app-tabs-content__tab-content" :value="'tab-2'">
          <perfect-scrollbar class="config">
            <template v-if="config">
              <v-container fluid>
                <v-row
                  justify-sm="space-between"
                  justify-md="start"
                  justify-lg="start"
                >
                  <v-col cols="12" sm="4" md="3" lg="2">
                    <v-switch
                      class="config__switch"
                      dense
                      hide-details
                      v-model="config.syncOnStart"
                      label="Sync on start"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12" sm="4" md="3" lg="2">
                    <v-switch
                      class="config__switch"
                      dense
                      hide-details
                      v-model="config.startAsTray"
                      label="Start as tray"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12" sm="4" md="3" lg="2">
                    <v-switch
                      class="config__switch"
                      dense
                      v-model="config.debugFileNames"
                      label="Debug file names"
                    ></v-switch>
                  </v-col>
                </v-row>
                <v-row justify="start">
                  <v-col cols="12" sm="6" md="3"
                    ><v-text-field
                      v-model="config.autoSyncIntervalInMinutes"
                      dense
                      hide-details="auto"
                      :rules="syncIntervalRules"
                      type="number"
                      label="Auto sync interval in minutes"
                      class="config__text-field"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-row justify="start">
                  <v-col cols="12" sm="6" md="3"
                    ><v-text-field
                      v-model="config.server.host"
                      dense
                      hide-details
                      label="Host"
                      class="config__text-field"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field
                      v-model="config.server.port"
                      dense
                      hide-details
                      type="number"
                      label="Port"
                      class="config__text-field"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="3"
                    ><v-text-field
                      v-model="config.server.user"
                      dense
                      hide-details
                      label="User"
                      class="config__text-field"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="3"
                    ><v-text-field
                      v-model="config.server.password"
                      dense
                      hide-details
                      type="password"
                      label="Password"
                      class="config__text-field"
                    ></v-text-field
                  ></v-col>
                </v-row>
              </v-container> </template
          ></perfect-scrollbar>
          <v-btn
            small
            elevation="0"
            class="config__save-button"
            @click="sendConfig()"
            >Save</v-btn
          >
        </v-tab-item>
        <v-tab-item class="app-tabs-content__tab-content" :value="'tab-3'">
          <perfect-scrollbar class="config">
          <template v-if="config">
            <div class="sync__add-button">
              <v-btn x-large icon color="green" @click="addSyncMap()">
                <v-icon>mdi-plus-circle-outline</v-icon>
              </v-btn>
            </div>
            <v-expansion-panels multiple accordion>
              <v-expansion-panel
                  class="sync__panel"
                  v-for="(syncItem, index) in config.syncMaps"
                  :key="syncItem"
              >
                <v-expansion-panel-header>
                  <span class="sync__item-header-text">{{ syncItem.id ? syncItem.id : "Please add name" }}</span>
                  <span class="sync__item-header-delete">
                    <v-btn icon color="error" @click.native.stop @click="deleteSyncMap($event, index)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </span>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-container fluid>
                    <v-row justify="start">
                      <v-col cols="12" sm="12" md="6"
                      ><v-text-field
                          v-model="syncItem.id"
                          @change="onIdChange"
                          dense
                          hide-details="auto"
                          type="text"
                          label="Sync name"
                          class="config__text-field"
                      ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row justify="start">
                      <v-col cols="12" sm="12" md="6"
                      ><v-text-field
                          v-model="syncItem.originFolder"
                          dense
                          hide-details="auto"
                          type="text"
                          label="Origin folder"
                          class="config__text-field"
                      ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row justify="start">
                      <v-col cols="12" sm="12" md="6"
                      ><v-text-field
                          v-model="syncItem.destinationFolder"
                          dense
                          hide-details="auto"
                          type="text"
                          label="Destination folder"
                          class="config__text-field"
                      ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row justify="start">
                      <v-col cols="12" sm="12" md="6"
                      ><v-text-field
                          v-model="syncItem.fileRegex"
                          dense
                          hide-details="auto"
                          type="text"
                          label="File rename regex"
                          class="config__text-field"
                      ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row justify="start">
                      <v-col cols="12" sm="12" md="6"
                      ><v-text-field
                          v-model="syncItem.fileRenameTemplate"
                          dense
                          hide-details="auto"
                          type="text"
                          label="File rename template"
                          class="config__text-field"
                      ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </template>
          </perfect-scrollbar>
          <v-btn
              small
              elevation="0"
              class="config__save-button"
              @click="sendConfig()"
          >Save</v-btn
          >
        </v-tab-item>
      </v-tabs-items>
    </div>
    <div class="bottom-bar">
      <div class="bottom-bar__file-progress">{{ fileProgress }}</div>
      <div class="bottom-bar__download-speed">{{ downloadSpeed }}</div>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AppCommand } from "../shared/types";
import {Config} from "../main/config";

@Component({})
export default class App extends Vue {
  logMessages: string[];
  fileProgress: string;
  downloadSpeed: string;
  config?: Config;
  tab: null;
  syncIntervalRules: Array<(value: number) => string | boolean>;

  addSyncMap() {
    this.config.syncMaps.unshift({
      id: "",
      destinationFolder: "",
      fileRenameTemplate: "",
      fileRegex: "",
      originFolder: ""
    });

    this.$forceUpdate();
  }

  deleteSyncMap(event: MouseEvent, index: number) {
    event.preventDefault();

    this.config.syncMaps.splice(index, 1);
    this.$forceUpdate();
  }

  constructor() {
    super();
    this.tab = null;
    this.logMessages = [];
    this.fileProgress = "";
    this.downloadSpeed = "";
    this.syncIntervalRules = [
      (v) => {
        return v >= 5 || "Must be at least 5 minutes.";
      },
    ];
  }

  onIdChange() {
    this.$forceUpdate();
  }

  created() {
    window.api.receive("log", (data: string) => {
      this.logMessages.unshift(data);
    });

    window.api.receive("config", (data: Config) => {
      this.config = data;
    });

    window.api.receive("updateBottomBar", (data) => {
      this.fileProgress = data.fileProgress;
      this.downloadSpeed = data.downloadSpeed;
    });
  }

  sendCommand(command: AppCommand) {
    window.api.send("command", command);
  }

  sendConfig() {
    window.api.send("config", this.config);
  }
}
</script>

<style scoped lang="scss">
.main-app {
  color: inherit;
  background: none;
}

.log,
.config {
  height: 100%;
}

.sync {
  &__panel {
    background-color: #272727;
  }

  &__item-header-delete {
    text-align: right;
  }

  &__add-button {
    margin-bottom: 5px;
  }
}

.config {
  &__save-button {
    z-index: 300;
    position: absolute;
    bottom: 0;
    right: 0;
  }
  &__switch {
    margin: 0;
  }
  &__text-field {
    margin: 0;
  }
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
    transition: all 500ms;
  }

  &__button-image {
    filter: brightness(1);
    transition: all 500ms;
  }

  &__button:hover &__button-image {
    filter: brightness(1.5);
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
