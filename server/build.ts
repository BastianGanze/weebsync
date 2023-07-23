import * as esbuild from "esbuild";
// @ts-ignore
import { version } from "../package.json";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    target: "esnext",
    platform: "node",
    format: "esm",
    outfile: "../build/index.mjs",
    define: {
      "process.env.__APP_VERSION__": JSON.stringify(`v${version}`),
    },
  })
  .then(() => {
    console.log("build done");
  });
