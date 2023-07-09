<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="true"
    :scrollable="true"
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        v-bind="attrs"
        :color="getIconColor()"
        v-on="on"
        @click="onOpenModal()"
      >
        <v-icon
          v-if="exists && !loading"
          title="Directory exists"
        >
          {{
            mdiCloudCheckVariant
          }}
        </v-icon>
        <v-icon
          v-if="!exists && !loading"
          title="Directory does not exist"
        >
          {{
            mdiCloudOff
          }}
        </v-icon><v-progress-circular
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
          icon
          @click="dialog = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
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
            v-for="item in current.children"
            :key="item.id"
            :disabled="loading || !item.isDir"
            @click="fetchDirectory(item.path)"
          >
            {{ item.name }}
          </v-list-item>
        </v-list>
      </perfect-scrollbar>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {PerfectScrollbar} from "vue3-perfect-scrollbar";
import {mdiCloudCheckVariant, mdiCloudOff} from "@mdi/js";

interface TreeChild {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeChild[];
}


function save() {
  /*if (this.loading) {
    return;
  }
  this.dialog = false;
  return this.current.path;*/
}

defineProps<{currentPath: string}>();

/*@Watch("currentPath")
onCurrentPathChanged() {
  if (this.timeout) {
    clearTimeout(this.timeout);
  }
  this.timeout = setTimeout(() => {
    //this.checkDirectory();
  }, 250);
}*/

const dialog = false;
const exists = false;
const loading = false;
const selectedItem = -1;
//const timeout: NodeJS.Timeout;

const current: TreeChild = {
  id: "root",
  name: ".",
  path: "",
  isDir: true,
  children: [],
};

function getIconColor(): string {
  if (this.loading) {
    return "white";
  }

  return this.exists ? "green" : "red";
}

/*function getPath(): string {
  return this.$props.currentPath;
}*/

function pathUp() {
  if (this.current.path.includes("/")) {
    //this.fetchDirectory(this.current.path.split("/").slice(0, -1).join("/"));
  }
}

function isRoot(path: string) {
  return !path.includes("/");
}

function onOpenModal() {
  //this.fetchDirectory(this.path);
}


/*checkDirectory(): Promise<void> {
  if (this.loading) {
    return Promise.resolve();
  }

  this.loading = true;
  return new Promise((resolve, reject) => {
    const listener = window.api.receive(
      "command-result",
      (result: DataEvent) => {
        match(result)
          .with(
            {
              type: "check-dir",
              exists: P.select(),
            },
            (exists) => {
              this.loading = false;
              try {
                window.api.unsub("command-result", listener);
                this.exists = exists;
                resolve();
              } catch (err) {
                window.api.unsub("command-result", listener);
                reject(err);
              }
            }
          )
          .otherwise(() => {});
      }
    );
    window.api.send("command", {
      type: "check-dir",
      path: this.path,
    });
  });
}*/

function fetchDirectory(itemPath: string) {
  console.log(itemPath);
  /*if (this.loading) {
    return Promise.resolve();
  }

  this.loading = true;
  return new Promise((resolve, reject) => {
    let listener = window.api.receive(
      "command-result",
      (result: DataEvent) => {
        match(result)
          .with(
            {
              type: "list-dir",
              result: P.select("result"),
              path: P.select("path"),
            },
            ({ result, path }) => {
              try {
                if (itemPath === path) {
                  window.api.unsub("command-result", listener);
                  this.selectedItem = -1;
                  this.current = {
                    path: itemPath,
                    name: itemPath,
                    isDir: true,
                    children: [],
                    id: itemPath,
                  };
                  this.current.children = result.map((r) => ({
                    id: `${this.current.path}/${r.name}`,
                    path: `${this.current.path}/${r.name}`,
                    isDir: r.type === 2,
                    name: r.name,
                    children: r.type === 2 ? [] : undefined,
                  }));
                  this.loading = false;
                  resolve();
                }
              } catch (err) {
                window.api.unsub("command-result", listener);
                reject(err);
                this.loading = false;
              }
            }
          )
          .otherwise(() => {});
      }
    );
    window.api.send("command", { type: "list-dir", path: itemPath });
  });*/
}

</script>

<style scoped lang="scss">
.scroll-wrapper {
  height: 100%;
}
</style>
