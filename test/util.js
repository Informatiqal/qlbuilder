import { copyFileSync, readFileSync } from "fs";

export function copySessionID(targetPath, subFolder) {
  copyFileSync(
    `${process.env.SESSION_ID_PATH}`,
    `${targetPath}/${subFolder}/session.txt`
  );

  return readFileSync(`${targetPath}/${subFolder}/session.txt`).toString();
}
