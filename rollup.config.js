import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: {
    format: "es",
    dir: "dist",
    sourcemap: true,
  },
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "fs",
    "os",
    "https",
    "readline",
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    commonjs(),
    json(),
    typescript({
      typescript: require("typescript"),
    }),
  ],
};
