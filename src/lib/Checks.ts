import { existsSync } from "fs";
import { CustomError } from "../lib/CustomError";

export class Checks {
  constructor() {}

  configFileExists() {
    if (!existsSync(`${process.cwd()}/config.yml`))
      throw new CustomError(
        `"config.yml" not found in the current folder`,
        "error",
        true
      );
  }

  srcFolderExists() {
    if (!existsSync(`${process.cwd()}/src`))
      throw new CustomError(
        `"src" folder was not found. Make sure that "qlBuilder" is started from within the project folder`,
        "error",
        true
      );
  }

  distFolderExists() {
    if (!existsSync(`${process.cwd()}/dist`))
      throw new CustomError(
        `"dist" folder was not found. Make sure that "qlBuilder" is started from within the project folder`,
        "error",
        true
      );
  }

  environmentExists() {}

  all() {
    this.configFileExists();
    this.srcFolderExists();
    this.distFolderExists();
    this.environmentExists();
  }

  srcAndDistExists() {
    this.srcFolderExists();
    this.distFolderExists();
  }
}
