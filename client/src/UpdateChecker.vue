<template>
  <div>
    <v-icon
      v-if="!showLink && version !== latestVersion"
      :title="`New Version available! (${latestVersion})`"
      small
      :icon="mdiAlert"
      color="yellow"
    />
    <a
      v-if="showLink && version !== latestVersion"
      class="text-decoration-none"
      target="_blank"
      href="https://github.com/BastianGanze/weebsync/releases/latest"
    ><v-icon
      small
      :icon="mdiAlert"
      color="yellow"
    /> Click here to download
      newest version.</a>
    <span v-if="showLink && version === latestVersion">Weebsync is up to date.</span>
  </div>
</template>

<script lang="ts" setup>
import {mdiAlert} from "@mdi/js";
import {useUiStore} from "./store";
import {storeToRefs} from "pinia";

const {version, latestVersion} = storeToRefs(useUiStore());
defineProps<{showLink?: Boolean}>();
</script>
