import { createInterface } from "readline";
import { FSWatcher, watch } from "chokidar";
import chalk from "chalk";
import { action as checkScriptAction } from "./CheckScript.js";
import { action as setScriptAction } from "./SetScript.js";
import { action as reloadAction } from "./Reload.js";

import { PluginArguments, PluginMeta } from "../../types/types.js";

const meta: PluginMeta = {
  command: {
    name: "watch",
    description: "Start qlBuilder in watch mode",
    aliases: ["Watch"],
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
      {
        flag: "-r, --reload",
        description: "Reload and save on each file change",
      },
      {
        flag: "-s, --set",
        description: "Set script and save app on each file change",
      },
      {
        flag: "--di, --disable",
        description: "Disable the auto syntax error check",
      },
    ],
  },
  options: {
    requireConnection: true,
    requireEnv: true,
    requireApp: true,
  },
};

async function action(args: PluginArguments) {
  commandsMessage();

  if (args.command.options.reload) reloadMessage();
  if (args.command.options.disable) disableChecks();

  const watcher: FSWatcher = watch(`${process.cwd()}/src/*.qvs`, {
    ignorePermissionErrors: true,
    awaitWriteFinish: true,
    ignoreInitial: true,
    depth: 0,
  });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("qlBuilder> ");
  rl.prompt();

  rl.on("line", async function (line) {
    const result = await parseLine(line.toLowerCase(), args);

    rl.prompt();
  });

  watcher.on("change", async function (fileName) {
    await checkScript(args);

    if (!args.command.options.reload && args.command.options.set) {
      await setScriptAction(args);
    }

    if (args.command.options.reload) {
      await reloadAction(args);
    }

    rl.prompt();
  });
}

function commandsMessage() {
  const commands = [
    "\n",
    "Commands during watch mode:\n",
    "    - set script: s or set\n",
    "    - reload app: r or rl\n",
    "    - clear console: c or cls\n",
    "    - check for syntax errors: e or err\n",
    "    - show this message again: ?\n",
    "    - exit - x or q\n",
    "(script is checked for syntax errors every time one of the qvs files is saved)\n",
  ].join("");

  console.log(commands);
}

async function parseLine(line: string, args) {
  if (line === "?") return commandsMessage();

  if (line === "x" || line == "q") {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    console.log("Bye!");
    process.exit(0);
  }

  if (line === "c" || line === "cls") {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    return;
  }

  if (line === "e" || line === "err") {
    await checkScript(args);
    return;
  }

  if (line === "s" || line === "set") {
    await setScriptAction(args);
    return;
  }

  if (line === "r" || line === "rl") {
    await reloadAction(args);
    return;
  }

  console.log(`Unknown command "${line}"`);
}

function disableChecks() {
  return chalk.yellow(
    `Auto syntax checks is disabled! Please use "e" or "err" anytime syntax check is required`,
  );
}

function reloadMessage() {
  return [
    "\n",
    'Reload is set to "true"!\n',
    "Each successful build will trigger:\n",
    "    - check the script for syntax errors\n",
    "        - if error - stop here. The app is not saved and the script is not updated\n",
    "    - set script\n",
    "    - reload app\n",
    "    - save app\n",
    "You know ... just saying :)\n",
  ].join("");
}

async function checkScript(args: PluginArguments) {
  const a = new args.engine.enigmaInstance(
    args.environment?.engineHost,
    args.environment?.appId,
    args.engine.auth?.data.headers,
    "",
    true,
  );

  const s = a.session;
  const g = await a.session.open();
  const b = { ...args };
  b.engine = {
    app: undefined,
    auth: args.engine.auth,
    enigmaInstance: args.engine.enigmaInstance,
    global: g,
    session: s,
  };

  const c1 = await checkScriptAction(b);

  return c1;
}

async function setAll() {
  console.log("TBA");
}

export { meta, action };
