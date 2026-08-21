import { copyFileSync, readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import { constants } from "./_testing_constants";

export function copySessionID(targetPath, subFolder) {
  copyFileSync(
    `${process.env.SESSION_ID_PATH}`,
    `${targetPath}/${subFolder}/session.txt`,
  );

  return readFileSync(`${targetPath}/${subFolder}/session.txt`).toString();
}

export function expect_subStringExistsInArray(input, subString, exact = false) {
  let subStringExists = false;

  if (exact == true) {
    subStringExists = input.filter((i) => i.includes(subString)).length == 1;
  } else {
    subStringExists = input.filter((i) => i.includes(subString)).length > 1;
  }

  return expect(subStringExists).to.equals(true);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function copySessionToExecEnvironment(path) {
  copyFileSync(constants.SESSION_ID_PATH, `${path}\\temp\\session.txt`);
}
