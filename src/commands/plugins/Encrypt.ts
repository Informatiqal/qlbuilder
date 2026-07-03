import { homedir } from "os";
import { readFileSync, writeFileSync } from "fs";
import crypto from "crypto";
import prompts from "prompts";
import { PluginArguments, PluginMeta } from "../../types/types.js";

const marker = "111111";

const meta: PluginMeta = {
  command: {
    name: "encrypt",
    description: "Encrypt C:\\Users\\<USERNAME>\\.qlBuilder.yml",
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
      },
    ],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

async function action(args: PluginArguments) {
  const configPath = `${homedir}/.qlbuilder.yml`;
  const configContent = readFileSync(configPath).toString();

  const potentialMarker = Buffer.from(
    configContent.slice(-12),
    "hex",
  ).toString();

  // check if the file is already encrypted
  // and if it is - exit
  if (potentialMarker == marker) {
    console.log("Config file is already encrypted.");
    console.log("Aborted");
    process.exit(0);
  }

  if (!args.command.options.password) {
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
      },
    );

    args.command.options.password = prompt.key;
  }

  const encryptedContent = await encryptText(
    configContent,
    args.command.options.password as string,
  );

  writeFileSync(configPath, encryptedContent);

  console.log("Config file is now ENCRYPTED");
}

function encryptText(text: string, secret: string) {
  const key = crypto.scryptSync(secret, "salt", 24);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-192-cbc", key, iv);

  const encrypted = cipher.update(text);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);

  const encryptedData =
    finalBuffer.toString("hex") +
    "." +
    iv.toString("hex") +
    "." +
    Buffer.from(marker).toString("hex");

  return encryptedData.trim();
}

export { meta, action };
