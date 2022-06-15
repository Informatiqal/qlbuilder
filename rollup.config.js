import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import pkg from "./package.json";
// import path from "path";
// const externalId = path.resolve(
//   __dirname,
//   "./node_modules/enigma.js/schemas/12.1306.0.json"
// );

export default {
  input: "src/index.js",
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
    "path",
    "url",
    "readline",
    // externalId,
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    commonjs(),
    json(),
  ],
};
