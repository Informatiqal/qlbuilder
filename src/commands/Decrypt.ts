import { homedir } from "os";
import { readFileSync, writeFileSync } from "fs";
import prompts from "prompts";
import { load as yamlLoad } from "js-yaml";

import { decryptText } from "../lib/EncryptDecrypt";

export async function decryptConfig(key: string) {
  const configPath = `${homedir}/.qlbuilder.yml`;

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
  const decryptedContent = await decryptText(configContent, key);
  try {
    yamlLoad(decryptedContent);
  } catch (e) {
    console.log(
      "Error while decrypting. The provided password was wrong or the encrypted file is corrupt"
    );
    process.exit(1);
  }

  writeFileSync(configPath, decryptedContent);
}
