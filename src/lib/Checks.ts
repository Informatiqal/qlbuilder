import { existsSync } from "fs";
import { CustomError } from "./CustomError.js";

export function configFileExists() {
  if (!existsSync(`${process.cwd()}/config.yml`))
    throw new CustomError(
      `"config.yml" not found in the current folder`,
      "error",
      true,
    );
}

export function srcFolderExists() {
  if (!existsSync(`${process.cwd()}/src`))
    throw new CustomError(
      `"src" folder was not found. Make sure that "qlBuilder" is started from within the project folder`,
      "error",
      true,
    );
}

export function distFolderExists() {
  if (!existsSync(`${process.cwd()}/dist`))
    throw new CustomError(
      `"dist" folder was not found. Make sure that "qlBuilder" is started from within the project folder`,
      "error",
      true,
    );
}

export function environmentExists() {}

export function all() {
  configFileExists();
  srcFolderExists();
  distFolderExists();
  environmentExists();
}

export function srcAndDistExists() {
  srcFolderExists();
  distFolderExists();
}
