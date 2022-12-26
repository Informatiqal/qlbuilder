import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json"));

export default {
  input: "src/index.ts",
  output: {
    file: pkg.module,
    format: "es",
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
    json(),
    typescript(),
    replace({
      values: {
        __VERSION: pkg.version,
      },
      preventAssignment: true,
    }),
  ],
};
