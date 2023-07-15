<template>
  <v-app class="main-app">
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
          :value="'console'"
        >
          Console
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          :value="'config'"
        >
          Config
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          :value="'sync'"
        >
          Sync
        </v-tab>
        <v-tab
          class="app-tabs__tab-item"
          :value="'info'"
        >
          <update-checker /> Info
        </v-tab>
      </v-tabs>
      <v-card-text class="app-tabs-content">
        <v-window v-model="tab">
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'console'"
          >
            <perfect-scrollbar class="log-wrap">
              <div class="log">
                <div
                  v-for="(log, index) in logs"
                  :key="index"
                  :class="'log-item ' + 'log-item--' + log.severity"
                >
                  [{{ formatDate(log.date) }}] {{ log.content }}
                </div>
              </div>
            </perfect-scrollbar>
          </v-window-item>
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'config'"
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
              :disabled="isSyncing"
              @click="sendConfig()"
            >
              Save
            </v-btn>
          </v-window-item>
          <v-window-item
            class="app-tabs-content__tab-content"
            :value="'sync'"
          >
            <div class="config">
              <template v-if="configLoaded">
                <div class="sync__add-button">
                  <v-btn
                    size="x-large"
                    variant="text"
                    :icon="mdiPlusCircleOutline"
                    color="green"
                    @click="addSyncMap()"
                  />
                </div>
                <div class="sync__panel-wrap">
                  <div class="sync__sync-panel-wrap-2">
                    <perfect-scrollbar class="sync__sync-panel-wrap-3">
                      <v-expansion-panels
                        class="sync__panels"
                        :multiple="true"
                        accordion
                      >
                        <v-expansion-panel
                          v-for="(syncItem, index) in config.syncMaps"
                          :key="syncItem"
                          class="sync__panel"
                        >
                          <v-expansion-panel-title class="sync__item-wrap">
                            <div class="sync__item">
                              <span class="sync__item-header-text">{{
                                syncItem.id ? syncItem.id : "Please add name"
                              }}</span>
                              <span class="sync__item-header-delete">
                                <v-btn
                                  size="x-large"
                                  variant="text"
                                  :icon="mdiContentCopy"
                                  color="primary"
                                  @click="copySyncMap($event, index)"
                                />
                                <v-btn
                                  size="x-large"
                                  variant="text"
                                  :icon="mdiDelete"
                                  color="error"
                                  @click="deleteSyncMap($event, index)"
                                />
                              </span>
                            </div>
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
                                      :model-value="syncItem.originFolder"
                                      dense
                                      hide-details="auto"
                                      type="text"
                                      label="Origin folder"
                                      class="config__text-field"
                                      @update:model-value="pathPicked(syncItem, $event)"
                                    />
                                    <ftp-viewer
                                      :item="syncItem"
                                      @save="pathPicked(syncItem, $event)"
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
                    </perfect-scrollbar>
                  </div>
                </div>
              </template>
            </div>
            <v-btn
              small
              elevation="0"
              class="config__save-button"
              :disabled="isSyncing"
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
            :value="'info'"
          >
            <v-list
              class="caption"
              dense
            >
              <v-list-item>Version {{ currentVersion }}</v-list-item>
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
        {{ bottomBar.fileProgress }}
      </div>
      <div class="bottom-bar__download-speed">
        {{ bottomBar.downloadSpeed }}
      </div>
    </div>
  </v-app>
</template>

<script lang="ts" setup>
import UpdateChecker from "./UpdateChecker.vue";
import FtpViewer from "./FtpViewer.vue";
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

import { useUiStore } from "./store";
import { SyncMap } from "@shared/types";
import { ref} from "vue";
import { useCommunication } from "./communication";
import dayjs from "dayjs";
import {storeToRefs} from "pinia";
import {mdiContentCopy, mdiDelete, mdiPlusCircleOutline} from "@mdi/js";

const { logs, configLoaded, config, isSyncing, currentVersion, bottomBar } = storeToRefs(useUiStore());
const communication = useCommunication();

const tab = ref('tab-1');

const syncIntervalRules: Array<(value: number) => string | boolean> = [
  (v) => {
    console.log(v);
    return true;
  },
];

function formatDate(date: string): string {
  return dayjs(new Date(date)).format('HH:mm:ss');
}

function addSyncMap() {
  config.value.syncMaps.unshift({
    id: "",
    destinationFolder: "",
    fileRenameTemplate: "",
    fileRegex: "",
    originFolder: "",
    rename: false,
  });
}

function deleteSyncMap(event: MouseEvent, index: number) {
  event.preventDefault();

  config.value.syncMaps.splice(index, 1);
}

function copySyncMap(event: MouseEvent, index: number) {
  event.preventDefault();

  config.value.syncMaps.splice(index + 1, 0, {
    ...config.value.syncMaps[index],
  });
}


function sendConfig() {
  communication.config(config.value);
}

function sync() {
  communication.sync();
}

function pathPicked(syncItem: SyncMap, update: string) {
  syncItem.originFolder = update;
}

</script>

<style scoped lang="scss">
.main-app {
  color: inherit;
  background: none;
}

.config {
  display: flex;
  flex-direction: column;
  height: 100%;
}


.log-wrap {
  height: 100%;
}

.log {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column-reverse;
  justify-content: flex-end;
}

.log-item {
  &--warn {
    color: rgb(var(--v-theme-warning));
  }
  &--debug {
    color: rgb(var(--v-theme-info));
  }
  &--error {
    color: rgb(var(--v-theme-error));
  }
}

.sync {
  &__panel-wrap {
    flex-grow: 1;
    min-height: 0;
    position: relative;
  }
  &__sync-panel-wrap-2 {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  &__sync-panel-wrap-3 {
    height: 100%;
  }

  &__panel {
    width: 100%;
    flex-grow: 0;
  }

  &__panel {
    background-color: #272727;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  &__item-wrap {
    padding: 0 24px;
  }

  &__item-header-text {
    display: flex;
    align-items: center;
  }

  &__item-header-delete {
    text-align: right;
  }

  &__add-button {
    margin-bottom: 5px;
    width: 100%;
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
  top: 0;
  left: 5px;
  bottom: 27px;
  right: 5px;
}

.app-tabs:deep(.v-tabs > .v-tabs-bar) {
  background: none;
  height: 30px;
}

.app-tabs {
  min-height: var(--v-tabs-height);
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
  background-color: #282a2d;
  flex-grow: 1;
  padding: 8px 0 0 8px;
  min-height: 0;
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
