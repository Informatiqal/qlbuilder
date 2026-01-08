import { homedir } from "os";
import { readFileSync } from "fs";
import prompts from "prompts";
import { load as yamlLoad } from "js-yaml";

import { decryptText, isEncrypted } from "../lib/EncryptDecrypt";

export async function decryptConfig(key?: string): Promise<string> {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configIsEncrypted = isEncrypted();

  if (configIsEncrypted == false) {
    console.log("Seems that the config is already decrypted");
    process.exit(0);
  }

  if (!key) {
    const prompt: { key: string } = await prompts(
      [
        {
          type: "password",
          name: "key",
          message: "Decryption key",
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

  const configContent = readFileSync(configPath).toString();
  const decryptedContent = decryptText(configContent, key);
  try {
    yamlLoad(decryptedContent);
  } catch (e) {
    console.log(
      "Error while decrypting. The provided password was wrong or the encrypted file is corrupt"
    );
    process.exit(1);
  }

  return decryptedContent;
}

export async function configDecryptedOrNot() {
  const configIsEncrypted = isEncrypted();
  let configContent = "";

  if (configIsEncrypted) {
    configContent = await decryptConfig();
  } else {
    configContent = readFileSync(`${homedir}/.qlbuilder.yml`).toString();
  }

  return configContent;
}
