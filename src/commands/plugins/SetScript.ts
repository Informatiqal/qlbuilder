import { PluginArguments, PluginMeta } from "../../types/types.js";

type CommandOptions = {};

const meta: PluginMeta = {
  command: {
    name: "setScript",
    description: "Build and set the script",
    aliases: ["setscript"],
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
    requireConnection: true,
    requireEnv: true,
    requireApp: true,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  const print = new args.tools.print();
  const spin = new args.tools.spinner(
    "Setting the script and saving ...",
    "arc",
  );

  spin.start();

  const builtScript = args.tools.build();

  //@ts-ignore
  await args.engine.app.setScript(builtScript).catch((e) => {
    throw new Error(e.message);
  });
  //@ts-ignore
  await args.engine.app.doSave().catch((e) => {
    throw new Error(e.message);
  });
  //@ts-ignore
  await args.engine.session.close().catch((e) => {});

  spin.stop();

  print.ok("Load script was set");
}

export { meta, action };
