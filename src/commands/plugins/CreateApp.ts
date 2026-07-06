import { PluginArguments, PluginMeta } from "../../types/types.js";

type ScriptError = {
  qTabIx: string;
  qLineInTab: number;
  qSecondaryFailure?: boolean;
};

type CommandOptions = {};

const meta: PluginMeta = {
  command: {
    name: "createApp",
    description: "Create new empty app and update the config.yml",
    aliases: ["createapp"],
    argument: "<name>",
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
    ],
  },
  options: {
    requireConnection: false,
    requireEnv: true,
    requireApp: false,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  let a = 1;
}

export { meta, action };
