import { existsSync, mkdirSync, writeFileSync } from "fs";
import { PluginArguments, PluginMeta } from "../../types/types.js";

type CommandOptions = {};

const meta: PluginMeta = {
  command: {
    name: "vscode",
    description:
      "Creates .vscode folder with pre-defined tasks.json and settings.json",
    aliases: [],
    argument: "",
    options: [],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  const currentFolder = process.cwd();

  const settings = JSON.stringify(
    {
      env: "environment name here",
    },
    null,
    4,
  );

  const tasks = JSON.stringify(
    {
      version: "2.0.0",
      tasks: [
        {
          label: "Set Script",
          detail: "Upload (set) the script to the Qlik app",
          type: "shell",
          command: "qlbuilder setscript ${config:env}",
        },
        {
          label: "Get Script",
          detail:
            "Download (get) the script from the Qlik app and save it as local files",
          type: "shell",
          command: "qlbuilder getscript ${config:env}",
        },
        {
          label: "Check Script",
          detail:
            "Check the script for syntax errors. The script is NOT set in the target app",
          type: "shell",
          command: "qlbuilder checkscript ${config:env}",
        },
        {
          label: "Build",
          detail:
            'Concatenate all local files to the "dist" folder. Nothing is uploaded',
          type: "shell",
          command: "qlbuilder build",
        },
        {
          label: "Reload",
          detail: "Upload (set) the script to the Qlik app and reloads it",
          type: "shell",
          command: "qlbuilder reload ${config:env}",
        },
        {
          label: "Watch",
          detail:
            "Start qlbuilder in watch mode. Checks the script for syntax errors on each file save",
          type: "shell",
          command: "qlbuilder watch  ${config:env}",
        },
        {
          label: "Watch Set Script",
          detail:
            "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save",
          type: "shell",
          command: "qlbuilder watch  ${config:env} -s",
        },
        {
          label: "Watch Set Script and Reload",
          type: "shell",
          detail:
            "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save and automatically trigger reload after this",
          command: "qlbuilder watch  ${config:env} -r",
        },
        {
          label: "Credential environments",
          type: "shell",
          detail:
            "List the names and type of all saved credential environments (from .qlBuilder.yml)",
          command: "qlbuilder cred",
        },
      ],
    },
    null,
    4,
  );

  if (!existsSync(`${currentFolder}/config.yaml`)) {
    const print = new args.tools.print();
    print.error(
      "Please run this command from the root project folder (where config.yaml) file is",
    );
    process.exit(1);
  }

  mkdirSync(`${currentFolder}/.vscode`);
  writeFileSync(`${currentFolder}/.vscode/tasks.json`, tasks);
  writeFileSync(`${currentFolder}/.vscode/settings.json`, settings);
}

export { meta, action };
