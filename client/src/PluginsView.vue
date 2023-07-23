<template>
  <div class="plugins">
    <perfect-scrollbar class="plugins__scrollbar-wrap">
      <div v-if="plugins.length === 0">No plugins available.</div>
      <v-expansion-panels :multiple="true">
        <v-expansion-panel
          v-for="plugin in plugins"
          :key="plugin.name"
          class="plugins__panel"
        >
          <v-expansion-panel-title class="plugins__item-wrap">
            <div class="plugins__item">
              <span class="plugins__item-header-text">{{ plugin.name }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-container :fluid="true">
              <v-row justify="start">
                <v-col
                  v-linkify:options="{
                    target: '_blank',
                  }"
                  cols="12"
                  sm="12"
                  class="plugins__description"
                >
                  {{ plugin.description }}
                </v-col>
              </v-row>
              <v-row
                v-for="(conf, idx) in plugin.pluginConfigurationDefinition"
                :key="plugin.name + idx"
                justify="start"
              >
                <template v-if="conf.type === 'label'">
                  <v-col class="plugins__label" cols="12" sm="12">{{
                    conf.label
                  }}</v-col>
                </template>
                <template v-if="conf.type !== 'label'">
                  <v-col
                    v-if="enabledWhen(plugin, conf.enableWhen)"
                    class="plugins__input"
                    cols="12"
                    sm="12"
                  >
                    <v-text-field
                      v-if="conf.type === 'text'"
                      v-model="plugin.config[conf.key]"
                      dense
                      hide-details="auto"
                      type="text"
                      :label="conf.key"
                      class="plugins__text-field"
                    />
                    <v-text-field
                      v-if="conf.type === 'number'"
                      v-model="plugin.config[conf.key]"
                      dense
                      hide-details="auto"
                      type="number"
                      :label="conf.key"
                      class="plugins__text-field"
                    />
                    <v-checkbox
                      v-if="conf.type === 'boolean'"
                      v-model="plugin.config[conf.key]"
                      dense
                      hide-details="auto"
                      type="text"
                      :label="conf.key"
                      class="plugins__text-field"
                    />
                  </v-col>
                </template>
              </v-row>
            </v-container>
            <v-btn
              small
              variant="tonal"
              elevation="0"
              class="plugins__save-button"
              @click="sendConfig(plugin)"
            >
              Save
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </perfect-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { useUiStore } from "./store";
import { storeToRefs } from "pinia";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { WeebsyncPluginBaseInfo } from "@shared/types";
import { useCommunication } from "./communication";

const { plugins } = storeToRefs(useUiStore());
const communication = useCommunication();

function sendConfig(plugin: WeebsyncPluginBaseInfo) {
  communication.sendPluginConfig(plugin.name, plugin.config);
}

function enabledWhen(
  config: WeebsyncPluginBaseInfo,
  enableWhenConfig?: WeebsyncPluginBaseInfo["pluginConfigurationDefinition"]["string"]["enableWhen"],
): boolean {
  if (!enableWhenConfig) {
    return true;
  }
  return config.config[enableWhenConfig.key] === enableWhenConfig.is;
}
</script>

<style scoped lang="scss">
.plugins {
  height: 100%;
  position: relative;
  display: flex;
  width: 100%;

  &__item-header-text {
    font-size: 16px;
    font-weight: bold;
  }

  &__description {
    font-size: 14px;
    white-space: pre-line;
  }

  &__scrollbar-wrap {
    width: 100%;
  }

  &__label {
    font-size: 16px;
    font-weight: bold;
  }

  &__input {
    padding: 0;
  }
}
</style>
