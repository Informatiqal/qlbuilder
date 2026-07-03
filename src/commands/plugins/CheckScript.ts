import { readdirSync, readFileSync, writeFileSync } from "fs";

import { PluginArguments, PluginMeta } from "../../types/types.js";
import { CustomError } from "../../lib/CustomError.js";

type ScriptError = {
  qTabIx: string;
  qLineInTab: number;
  qSecondaryFailure?: boolean;
};

const meta: PluginMeta = {
  command: {
    name: "checkScript",
    description:
      "Check the local script for syntax errors against Qlik session app",
    aliases: ["checkscript"],
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
    requireApp: false,
  },
};

async function action(args: PluginArguments) {
  const build = new args.tools.build();
  const print = new args.tools.print();
  const spin = new args.tools.spinner("Building the script", "hamburger");

  spin.start();

  build.run();
  const script = build.builtScript;

  const scriptErrors: ScriptError[] = await setScriptAndCheckSyntax(
    script,
    args.engine.global,
    args.engine.session,
  );

  spin.stop();

  if (scriptErrors.length == 0) {
    print.ok("No syntax errors were found");
    spin.stop();
    return {
      errorsCount: 0,
      script,
    };
  }

  await displayScriptErrors(scriptErrors);

  return { errorsCount: scriptErrors.length, script };
}

async function setScriptAndCheckSyntax(script: string, global, session) {
  try {
    const sessionApp = await global.createSessionApp();
    await sessionApp.setScript(script);
    const checkSyntax = await sessionApp.checkScriptSyntax();
    await session.close();

    return checkSyntax;
  } catch (e: any) {
    session.close();
    throw new CustomError(e.message, "error", true);
  }
}

function displayScriptErrors(scriptErrors: ScriptError[]) {
  const scriptFiles = readdirSync(`${process.cwd()}/src`).filter(function (f) {
    return f.indexOf(".qvs") > -1;
  });

  for (let scriptError of scriptErrors) {
    const outputEntries: string[] = [""];

    const tabScript = readFileSync(
      `${process.cwd()}/src/${scriptFiles[scriptError.qTabIx]}`,
    )
      .toString()
      .split("\n");

    const isSecondary = scriptError.qSecondaryFailure || false;
    let secondaryPrefix = "";

    if (isSecondary) {
      secondaryPrefix = "\t";
      outputEntries.push(`${secondaryPrefix}\t(secondary failure)`);
    }

    outputEntries.push(
      `${secondaryPrefix}\tTab : ${scriptFiles[scriptError.qTabIx]}`,
    );
    outputEntries.push(`${secondaryPrefix}\tLine: ${scriptError.qLineInTab}`);
    outputEntries.push(
      `${secondaryPrefix}\tCode: ${tabScript[scriptError.qLineInTab - 1]}`,
    );

    console.log(outputEntries.join("\n"));
  }

  const errorsCount = scriptErrors.filter((e) => !e.qSecondaryFailure).length;
  console.log(`\n${errorsCount} Syntax error(s) were found`);
}

export { meta, action };
