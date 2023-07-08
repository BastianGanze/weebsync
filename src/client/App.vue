<template>
  <div class="main-app">
    <div class="content-container">
      <v-tabs
        v-model="tab"
        class="app-tabs"
        hide-slider
        background-color="transparent"
        dark
      >
        <v-tab
          class="app-tabs__tab-item"
          href="#tab-1"
        >
          Console
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          href="#tab-2"
        >
          Config
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          href="#tab-3"
        >
          Sync
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          href="#tab-4"
        >
          <update-checker /> Info
        </v-tab>
      </v-tabs>
      <v-card-text class="app-tabs-content">
        <v-window v-model="tab">
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'tab-1'"
          >
            <perfect-scrollbar class="log">
              <div
                v-for="(log, index) in logs"
                :key="index"
                class="log-item"
              >
                {{ log }}
              </div>
            </perfect-scrollbar>
          </v-window-item>
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'tab-2'"
          >
            <perfect-scrollbar class="config">
              <template v-if="configLoaded">
                <v-container :fluid="true">
                  <v-row
                    justify-sm="space-between"
                    justify-md="start"
                    justify-lg="start"
                  >
                    <v-col
                      cols="12"
                      sm="4"
                      md="3"
                      lg="2"
                    >
                      <v-switch
                        v-model="config.syncOnStart"
                        class="config__switch"
                        dense
                        hide-details
                        label="Sync on start"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="4"
                      md="3"
                      lg="2"
                    >
                      <v-switch
                        v-model="config.startAsTray"
                        class="config__switch"
                        dense
                        hide-details
                        label="Start as tray"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="4"
                      md="3"
                      lg="2"
                    >
                      <v-switch
                        v-model="config.debugFileNames"
                        class="config__switch"
                        dense
                        label="Debug file names"
                      />
                    </v-col>
                  </v-row>
                  <v-row justify="start">
                    <v-col
                      cols="12"
                      sm="6"
                      md="3"
                    >
                      <v-text-field
                        v-model="config.autoSyncIntervalInMinutes"
                        dense
                        hide-details="auto"
                        :rules="syncIntervalRules"
                        type="number"
                        label="Auto sync interval in minutes"
                        class="config__text-field"
                      />
                    </v-col>
                  </v-row>
                  <v-row justify="start">
                    <v-col
                      cols="12"
                      sm="6"
                      md="3"
                    >
                      <v-text-field
                        v-model="config.server.host"
                        dense
                        hide-details
                        label="Host"
                        class="config__text-field"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="3"
                    >
                      <v-text-field
                        v-model="config.server.port"
                        dense
                        hide-details
                        type="number"
                        label="Port"
                        class="config__text-field"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="3"
                    >
                      <v-text-field
                        v-model="config.server.user"
                        dense
                        hide-details
                        label="User"
                        class="config__text-field"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="3"
                    >
                      <v-text-field
                        v-model="config.server.password"
                        dense
                        hide-details
                        type="password"
                        label="Password"
                        class="config__text-field"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </template>
            </perfect-scrollbar>
            <v-btn
              small
              elevation="0"
              class="config__save-button"
              @click="sendConfig()"
            >
              Save
            </v-btn>
          </v-window-item>
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'tab-3'"
          >
            <perfect-scrollbar class="config">
              <template v-if="configLoaded">
                <div class="sync__add-button">
                  <v-btn
                    x-large
                    icon
                    color="green"
                    @click="addSyncMap()"
                  >
                    <v-icon>mdi-plus-circle-outline</v-icon>
                  </v-btn>
                </div>
                <v-expansion-panels
                  :multiple="true"
                  accordion
                >
                  <v-expansion-panel
                    v-for="(syncItem, index) in config.syncMaps"
                    :key="syncItem"
                    class="sync__panel"
                  >
                    <v-expansion-panel-title>
                      <span class="sync__item-header-text">{{
                        syncItem.id ? syncItem.id : "Please add name"
                      }}</span>
                      <span class="sync__item-header-delete">
                        <v-btn
                          icon
                          color="primary"
                          @click="copySyncMap($event, index)"
                        >
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          color="error"
                          @click="deleteSyncMap($event, index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-container :fluid="true">
                        <v-row justify="start">
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <v-text-field
                              v-model="syncItem.id"
                              dense
                              hide-details="auto"
                              type="text"
                              label="Sync name"
                              class="config__text-field"
                              @change="onIdChange"
                            />
                          </v-col>
                        </v-row>
                        <v-row justify="start">
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <div class="config__actionable-field">
                              <v-text-field
                                :value="syncItem.originFolder"
                                dense
                                hide-details="auto"
                                type="text"
                                label="Origin folder"
                                class="config__text-field"
                                @input="originChange(syncItem, $event)"
                              />
                              <ftp-viewer
                                :current-path="syncItem.originFolder"
                                @save="originChange(syncItem, $event)"
                              />
                            </div>
                          </v-col>
                        </v-row>
                        <v-row justify="start">
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <v-text-field
                              v-model="syncItem.destinationFolder"
                              dense
                              hide-details="auto"
                              type="text"
                              label="Destination folder"
                              class="config__text-field"
                            />
                          </v-col>
                        </v-row>
                        <v-row justify="start">
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <v-switch
                              v-model="syncItem.rename"
                              class="v-input--reverse config__switch"
                              dense
                              hide-details
                              label="Rename items on sync"
                              @change="onChange()"
                            />
                          </v-col>
                        </v-row>
                        <v-row
                          v-if="syncItem.rename"
                          justify="start"
                        >
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <v-text-field
                              v-model="syncItem.fileRegex"
                              dense
                              hide-details="auto"
                              type="text"
                              label="File rename regex"
                              class="config__text-field"
                            />
                          </v-col>
                        </v-row>
                        <v-row
                          v-if="syncItem.rename"
                          justify="start"
                        >
                          <v-col
                            cols="12"
                            sm="12"
                          >
                            <v-text-field
                              v-model="syncItem.fileRenameTemplate"
                              dense
                              hide-details="auto"
                              type="text"
                              label="File rename template"
                              class="config__text-field"
                            />
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </template>
            </perfect-scrollbar>
            <v-btn
              small
              elevation="0"
              :disabled="isSyncing"
              class="config__save-button"
              @click="sendConfig()"
            >
              Save
            </v-btn>
            <v-btn
              small
              elevation="0"
              class="config__sync-button"
              @click="sync()"
            >
              {{ isSyncing ? "Stop Sync" : "Sync" }}
            </v-btn>
          </v-window-item>
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'tab-4'"
          >
            <v-list
              class="caption"
              dense
            >
              <v-list-item>Version {{ version }}</v-list-item>
              <v-list-item>
                <span>For updates and general information look
                  <a
                    href="https://github.com/BastianGanze/weebsync/releases"
                    target="_blank"
                  >here</a>.</span>
              </v-list-item>
              <v-list-item>
                <update-checker :show-link="true" />
              </v-list-item>
            </v-list>
          </v-window-item>
        </v-window>
      </v-card-text>
    </div>
    <div class="bottom-bar">
      <div class="bottom-bar__file-progress">
        {{ fileProgress }}
      </div>
      <div class="bottom-bar__download-speed">
        {{ downloadSpeed }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UpdateChecker from "./UpdateChecker.vue";
import FtpViewer from "./FtpViewer.vue";
import { communication } from "./communication";
import {useUiStore} from "./store";
import {SyncMap} from "../shared/types";
import {ref} from "vue";

const {logs, configLoaded, config} = useUiStore();

const fileProgress: string = "";
const downloadSpeed: string = "";
const tab = ref(null);
const isSyncing: boolean = false;
const version: string = "LOADING";
const syncIntervalRules: Array<(value: number) => string | boolean> = [(v) => {console.log(v); return true}];

function addSyncMap() {
  this.config.syncMaps.unshift({
    id: "",
    destinationFolder: "",
    fileRenameTemplate: "",
    fileRegex: "",
    originFolder: "",
    rename: false,
  });

  this.$forceUpdate();
}

function deleteSyncMap(event: MouseEvent, index: number) {
  event.preventDefault();

  this.config.syncMaps.splice(index, 1);
  this.$forceUpdate();
}

function copySyncMap(event: MouseEvent, index: number) {
  event.preventDefault();

  this.config.syncMaps.splice(index + 1, 0, {
    ...this.config.syncMaps[index],
  });
  this.$forceUpdate();
}

function onIdChange() {
  this.$forceUpdate();
}

function sendConfig() {
  communication.send({ type: "config", content: this.config });
}

function sync() {
  communication.send({ type: "sync" });
}

function onChange() {
  this.$forceUpdate();
}

function originChange(syncItem: SyncMap, update: string) {
  syncItem.originFolder = update;
  this.$forceUpdate();
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
  &__actionable-field {
    display: flex;
  }
  &__save-button {
    z-index: 200;
    position: absolute;
    bottom: 0;
    right: 0;
  }
  &__sync-button {
    z-index: 200;
    position: absolute;
    bottom: 0;
    right: 72px;
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

.app-tabs:deep(.v-tabs > .v-tabs-bar) {
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
  &__tab-item:deep(.v-tab--active) {
    background-color: #282a2d;
  }
}

.app-tabs-content {
  &:deep(.v-window__container) {
    height: 100%;
  }
  background-color: #282a2d;
  flex: 1 1 auto;
  padding: 8px 0 0 8px;

  &__tab-content {
    height: 100%;
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

  &__file-progress,
  &__download-speed {
    display: flex;
    align-items: center;
  }

  &__file-progress {
    padding-left: 8px;
  }

  &__download-speed {
    padding-right: 8px;
  }
}
</style>
