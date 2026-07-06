import { homedir } from "os";
import { readFileSync, writeFileSync } from "fs";
import crypto from "crypto";
import prompts from "prompts";
import { load as yamlLoad } from "js-yaml";
import { PluginArguments, PluginMeta } from "../../types/types.js";

const marker = "111111";

type CommandOptions = {
  password: string;
  view: boolean;
};

const meta: PluginMeta = {
  command: {
    name: "decrypt",
    description: "Decrypt C:\\Users\\<USERNAME>\\.qlBuilder.yml",
    aliases: [],
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
      {
        flag: "-p, --password <password>",
        description:
          "WARNING! The password will stay in the shell history until cleared",
        defaultValue: undefined,
      },
      {
        flag: "--view",
        description: "Preview the config content in the console",
        defaultValue: false,
      },
    ],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configIsEncrypted = isEncrypted();

  if (configIsEncrypted == false) {
    console.log("Seems that the config is already decrypted");
    process.exit(0);
  }

  if (!args.command.options.password) {
    const prompt = await askForPassword();
    args.command.options.password = prompt.key;
  }

  const configContent = readFileSync(configPath).toString();
  const decryptedContent = decryptText(
    configContent,
    args.command.options.password as string,
  );
  try {
    yamlLoad(decryptedContent);
  } catch (e) {
    console.log(
      "Error while decrypting. The provided password was wrong or the encrypted file is corrupt",
    );
    process.exit(1);
  }

  if (args.command.options.view == false) {
    writeFileSync(`${homedir}/.qlbuilder.yml`, decryptedContent);
    console.log("Config file is now DECRYPTED");
  } else {
    console.log(decryptedContent);
  }

  return decryptedContent;
}

export function isEncrypted(): boolean {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configContent = readFileSync(configPath).toString();

  const potentialMarker = Buffer.from(
    configContent.slice(-12),
    "hex",
  ).toString();

  if (potentialMarker == marker) return true;

  return false;
}

export function decryptText(encrypted: string, secret: string) {
  const encryptedSplit = encrypted.split(".");

  if (encryptedSplit.length != 3) {
    //
  }

  const encryptedData = Buffer.from(encryptedSplit[0], "hex");
  const iv = Buffer.from(encryptedSplit[1], "hex");
  const markerString = Buffer.from(encryptedSplit[2], "hex").toString();

  if (markerString != marker) {
    //
  }

  const decipher = crypto.createDecipheriv(
    "aes-192-cbc",
    crypto.scryptSync(secret, "salt", 24),
    iv,
  );

  decipher.setAutoPadding(true);

  const decrypted = decipher.update(encryptedData);

  return decrypted.toString().trim();
}

export async function askForPassword() {
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
    },
  );

  return prompt;
}

export async function getConfigContent() {
  let rawContent = readFileSync(`${homedir}/.qlbuilder.yml`).toString();

  const isEncryptedConfig = await isEncrypted();
  if (isEncryptedConfig) {
    const p = await askForPassword();
    rawContent = decryptText(rawContent, p.key);
  }

  let parsedContent: any = undefined;
  try {
    parsedContent = yamlLoad(rawContent);
  } catch (e) {
    console.log(
      "Error while decrypting. The provided password was wrong or the encrypted file is corrupt",
    );
    process.exit(1);
  }

  return { rawContent, parsedContent };
}

export { meta, action };
