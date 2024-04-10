import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

export default {
  input: "../build/index.mjs",
  output: {
    file: "../build/index.js",
    format: "cjs",
    name: "Weebsync",
  },

  plugins: [
    resolve({
      preferBuiltins: true,
    }), // So Rollup can find external modules
    commonjs(), // So Rollup can convert external modules to an ES module
    terser(),
    json(),
  ],
};
