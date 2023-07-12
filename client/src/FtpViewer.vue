<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="true"
    :scrollable="true"
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <template #activator="{ props }">
      <v-btn
        size="x-large"
        variant="text"
        v-bind="props"
        :color="getIconColor()"
        @click="onOpenModal()"
      >
        <v-icon
          v-if="exists && !loading"
          :icon="mdiCloudCheckVariant"
          title="Directory exists"
        />
        <v-icon
          v-if="!exists && !loading"
          :icon="mdiCloudOff"
          title="Directory does not exist"
        /><v-progress-circular
          v-if="loading"
          indeterminate
          width="2"
          size="10"
        />
      </v-btn>
    </template>
    <v-card>
      <v-toolbar>
        <v-btn
          variant="text"
          :icon="mdiClose"
          @click="dialog = false"
        />
        <v-toolbar-title>{{ current.name }}</v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn
            color="secondary"
            :disabled="loading"
            @click="save()"
          >
            <v-progress-circular
              v-if="loading"
              indeterminate
              width="2"
              size="14"
            />Pick
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <perfect-scrollbar class="scroll-wrapper">
        <v-list v-model="selectedItem">
          <v-list-item
            v-if="!isRoot(current.path)"
            :disabled="loading"
            @click="pathUp()"
          >
            ..
          </v-list-item>
          <v-list-item
            v-for="child in current.children"
            :key="child.id"
            :disabled="loading || !child.isDir"
            @click="fetchDirectory(child.path)"
          >
            {{ child.name }}
          </v-list-item>
        </v-list>
      </perfect-scrollbar>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {PerfectScrollbar} from "vue3-perfect-scrollbar";
import {mdiClose, mdiCloudCheckVariant, mdiCloudOff} from "@mdi/js";
import {ref, watch} from "vue";
import {useCommunication} from "./communication";
import {SyncMap} from "@shared/types";

interface TreeChild {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeChild[];
}

const emit = defineEmits(['save'])

function save() {
  if (this.loading) {
    return;
  }
  this.dialog = false;
  emit('save', current.value.path);
}

let timeout: number;
const ftpProps = defineProps<{item: SyncMap}>();
const syncItem = ref(ftpProps.item);

watch([ftpProps], () => {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    checkDirectory(syncItem.value.originFolder);
  }, 250);
}, {immediate: true})

const dialog = ref(false);
const exists = ref(false);
const loading = ref(false);
const selectedItem = ref(-1);


const current = ref<TreeChild>({
  id: "root",
  name: ".",
  path: "",
  isDir: true,
  children: [],
});

function getIconColor(): string {
  if (loading.value) {
    return "white";
  }

  return exists.value ? "green" : "red";
}

function pathUp() {
  if (this.current.path.includes("/")) {
    fetchDirectory(this.current.path.split("/").slice(0, -1).join("/"));
  }
}

function isRoot(path: string) {
  return !path.includes("/");
}

function onOpenModal() {
  fetchDirectory(syncItem.value.originFolder);
}

const communication = useCommunication();

function checkDirectory(path: string): Promise<void> {
  if (!path) {
    console.error("No path?!");
    return Promise.resolve();
  }
  if (loading.value) {
    return Promise.resolve();
  }

  loading.value = true;
  return new Promise((resolve) => {
    communication.dataEvents.one((event) => {
      loading.value = false;
      if (event.type === 'checkDir') {
        exists.value = event.exists;
      }
      resolve();
    })
    communication.send({type: 'checkDir', path})
  });
}

function fetchDirectory(itemPath: string) {
  if (loading.value) {
    return Promise.resolve();
  }

  loading.value = true;
  return new Promise((resolve) => {
    const path = itemPath;
    communication.dataEvents.one((result) => {
      loading.value = false;
      if (result.type === 'listDir') {
        console.log(result);
            selectedItem.value = -1;
            current.value = {
              path: path,
              name: path,
              isDir: true,
              children: [],
              id: path,
            };
            current.value.children = result.result.map((r) => ({
              id: `${current.value.path}/${r.name}`,
              path: `${current.value.path}/${r.name}`,
              isDir: r.type === 2,
              name: r.name,
              children: r.type === 2 ? [] : undefined,
            }));
      }
      resolve();
      }
    );
    communication.send({type: 'listDir', path});
  });
}

</script>

<style scoped lang="scss">
.scroll-wrapper {
  height: 100%;
}
</style>
