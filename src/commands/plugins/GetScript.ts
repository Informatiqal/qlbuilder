import { readdirSync, rmSync, writeFileSync } from "fs";

import { PluginArguments, PluginMeta } from "../../types/types.js";
import { CustomError } from "../../lib/CustomError.js";
import { createInterface } from "readline";
import filenamify from "filenamify";

const meta: PluginMeta = {
  command: {
    name: "getScript",
    description:
      "Get the script from the target Qlik app and overwrite the local script",
    aliases: ["getscript"],
    options: [
      {
        flag: "-y",
        description:
          "WARNING! Using this option will automatically overwrite the local script files without any prompt",
      },
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

async function action(args: PluginArguments) {
  const build = new args.tools.build();
  const print = new args.tools.print();
  const spin = new args.tools.spinner("Building the script", "hamburger");

  let overwrite: Boolean = true;

  if (!args.command.options.y) overwrite = await askOverwrite();

  if (overwrite === true) {
    spin.start();

    const loadScript = await retrieveQlikScript(
      args.engine.session,
      args.engine.app,
    );

    //@ts-ignore
    await args.engine.session.close().catch((e) => {});

    clearLocalFiles();
    writeLocalFiles(loadScript);
    build.run();

    print.ok("Local script files were created");
  } else {
    print.warn("Nothing was changed");
  }

  spin.stop();
}

async function askOverwrite() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return await new Promise<Boolean>((resolve, reject) =>
    rl.question(
      `This will overwrite all local files. Are you sure? (y/n) `,
      (answer) => {
        if (answer.toLowerCase() == "y") {
          resolve(true);
        }
        rl.close();
        resolve(false);
      },
    ),
  );
}

async function retrieveQlikScript(session, app) {
  let loadScript = "";

  try {
    loadScript = await app.getScript();
  } catch (e: any) {
    await session.close();
    throw new CustomError(e.message, "error", true);
  }

  try {
    await session.close();
  } catch (e) {}

  return loadScript.split("///$tab ");
}

function clearLocalFiles() {
  try {
    readdirSync(`${process.cwd()}/src`).forEach((f) =>
      rmSync(`${process.cwd()}/src/${f}`),
    );
  } catch (e: any) {
    try {
    } catch (e) {}

    throw new CustomError(e.message, "error", true);
  }
}

async function writeLocalFiles(scriptTabs) {
  try {
    for (let [i, tab] of scriptTabs.entries()) {
      if (tab.length > 0) {
        const rows = tab.split("\r\n");
        const tabName = rows[0];
        const tabNameSafe = filenamify(tabName, { replacement: "" });

        const scriptContent = rows.slice(1, rows.length).join("\r\n");

        writeFileSync(
          `${process.cwd()}/src/${i}--${tabNameSafe}.qvs`,
          scriptContent,
        );
      }
    }
  } catch (e: any) {
    throw new CustomError(e.message, "error", true);
  }
}

export { meta, action };
