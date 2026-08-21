import { PluginArguments, PluginMeta } from "../../types/types.js";
import { existsSync, readdirSync } from "fs";
import { homedir } from "os";

type CommandOptions = {
  output: string;
};

const meta: PluginMeta = {
  command: {
    name: "templates",
    description: "List the available config and script templates",
    aliases: [],
    options: [],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  const print = new args.tools.print();

  const templateFolder = `${homedir()}/qlBuilder_templates`;
  try {
    let templates: { name: string; type: string }[] = [];

    if (existsSync(`${templateFolder}/script`)) {
      templates.push(
        ...readdirSync(`${templateFolder}/script`, {
          withFileTypes: true,
        })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => ({ name: dirent.name, type: "SCRIPT" })),
      );
    }

    if (existsSync(`${templateFolder}/config`)) {
      templates.push(
        ...readdirSync(`${templateFolder}/config`, {
          withFileTypes: true,
        })
          .filter(
            (dirent) =>
              dirent.isFile() &&
              dirent.name.toLowerCase().split(".").pop() == "yml",
          )
          .map((dirent) => ({
            name: dirent.name.replace(".yml", ""),
            type: "CONFIG",
          })),
      );
    }

    if (templates.length == 0)
      print.warn("Template folder exists but no templates were found");
    if (templates.length > 1) console.table(templates);

    process.exit(0);
  } catch (e: any) {
    print.error(e.message);
    process.exit(1);
  }
}

export { meta, action };
