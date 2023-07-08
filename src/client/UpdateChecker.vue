<template>
  <div>
    <v-icon
      v-if="!showLink && version !== latestVersion"
      :title="`New Version available! (${latestVersion})`"
      small
      color="yellow"
    >
      mdi-alert
    </v-icon>
    <a
      v-if="showLink && version !== latestVersion"
      class="text-decoration-none"
      target="_blank"
      href="https://github.com/BastianGanze/weebsync/releases/latest"
    ><v-icon
      small
      color="yellow"
    >mdi-alert</v-icon> Click here to download
      newest version.</a>
    <span v-if="showLink && version === latestVersion">Weebsync is up to date.</span>
  </div>
</template>

<script lang="ts" setup>
const version = "LOADING";
const latestVersion = "LOADING";

defineProps<{showLink?: Boolean}>();
</script>
