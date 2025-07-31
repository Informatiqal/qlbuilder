import { homedir } from "os";
import { readFileSync, writeFileSync } from "fs";
import prompts from "prompts";

import { encryptText, marker } from "../lib/EncryptDecrypt";

export async function encryptConfig(key: string) {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configContent = readFileSync(configPath).toString();

  const potentialMarker = Buffer.from(
    configContent.slice(-12),
    "hex"
  ).toString();

  // check if the file is already encrypted
  // and if it is - ask for confirmation before continue
  if (potentialMarker == marker) {
    const prompt: { reEncrypt: boolean } = await prompts(
      [
        {
          type: "toggle",
          name: "reEncrypt",
          message: "Config file is already encrypted. Double encrypt it?",
          initial: false,
          active: "yes",
          inactive: "no",
        },
      ],
      {
        onCancel: () => {
          console.log("");
          console.log("Aborted");
          console.log("");
          process.exit(0);
        },
      }
    );

    if (prompt.reEncrypt == false) {
      console.log("Aborted");
      process.exit(0);
    }
  }

  if (!key) {
    const prompt: { key: string } = await prompts(
      [
        {
          type: "password",
          name: "key",
          message: "Encryption key",
        },
      ],
      {
        onCancel: () => {
          console.log("");
          console.log("Aborted");
          console.log("");
          process.exit(0);
        },
      }
    );

    key = prompt.key;
  }

  const encryptedContent = await encryptText(configContent, key);

  writeFileSync(configPath, encryptedContent);
}
