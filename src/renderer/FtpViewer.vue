<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    scrollable
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        icon
        v-bind="attrs"
        v-on="on"
        @click="onOpenModal()"
        :color="iconColor"
        ><v-icon v-if="exists && !loading" title="Directory exists">{{
          mdiCloudCheckVariant
        }}</v-icon>
        <v-icon v-if="!exists && !loading" title="Directory does not exist">{{
          mdiCloudOff
        }}</v-icon
        ><v-progress-circular
          v-if="loading"
          indeterminate
          width="2"
          size="10"
        ></v-progress-circular
      ></v-btn>
    </template>
    <v-card>
      <v-toolbar>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ current.name }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn color="secondary" :disabled="loading" @click="save()">
            <v-progress-circular
              indeterminate
              width="2"
              size="14"
              v-if="loading"
            ></v-progress-circular
            >Pick</v-btn
          >
        </v-toolbar-items>
      </v-toolbar>
      <perfect-scrollbar class="scroll-wrapper">
        <v-list-item-group v-model="selectedItem">
          <v-list-item
            :disabled="loading"
            @click="pathUp()"
            v-if="!isRoot(currentPath)"
            >..</v-list-item
          >
          <v-list-item
            v-for="item in current.children"
            @click="fetchDirectory(item.path)"
            :disabled="loading || !item.isDir"
          >
            {{ item.name }}
          </v-list-item>
        </v-list-item-group>
      </perfect-scrollbar>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.scroll-wrapper {
  height: 100%;
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { match, P } from "ts-pattern";
import { AppCommandResult } from "../shared/types";
import { mdiCloudCheckVariant, mdiCloudOff } from "@mdi/js";
import { Emit, Prop, Watch } from "vue-property-decorator";

interface TreeChild {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeChild[];
}

@Component
export default class App extends Vue {
  @Emit()
  save(): string {
    if (this.loading) {
      return;
    }
    this.dialog = false;
    return this.current.path;
  }
  @Prop(String)
  currentPath: string;
  @Watch("currentPath")
  onCurrentPathChanged() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.checkDirectory();
    }, 250);
  }

  dialog = false;
  exists = false;
  loading = false;
  selectedItem = -1;
  timeout: NodeJS.Timeout;
  mdiCloudCheckVariant = mdiCloudCheckVariant;
  mdiCloudOff = mdiCloudOff;

  current: TreeChild = {
    id: "root",
    name: ".",
    path: "",
    isDir: true,
    children: [],
  };

  get iconColor(): string {
    if (this.loading) {
      return "white";
    }

    return this.exists ? "green" : "red";
  }

  get path(): string {
    return this.$props.currentPath;
  }

  pathUp() {
    if (this.current.path.includes("/")) {
      this.fetchDirectory(this.current.path.split("/").slice(0, -1).join("/"));
    }
  }

  isRoot(path: string) {
    return !path.includes("/");
  }

  onOpenModal() {
    this.fetchDirectory(this.path);
  }

  mounted() {
    this.checkDirectory();
  }

  checkDirectory(): Promise<void> {
    if (this.loading) {
      return Promise.resolve();
    }

    this.loading = true;
    return new Promise((resolve, reject) => {
      const listener = window.api.receive(
        "command-result",
        (result: AppCommandResult) => {
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
  }

  fetchDirectory(itemPath: string): Promise<void> {
    if (this.loading) {
      return Promise.resolve();
    }

    this.loading = true;
    return new Promise((resolve, reject) => {
      let listener = window.api.receive(
        "command-result",
        (result: AppCommandResult) => {
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
    });
  }
}
</script>
