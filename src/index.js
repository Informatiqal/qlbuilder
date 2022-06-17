import { program } from "commander";
import { writeLog } from "./packages/common.js";

import {
  create,
  setScript,
  getScript,
  checkScript,
  watch,
  build,
  reload,
  download,
  version,
  vsCode,
} from "./commands/index.js";

(async function () {
  program
    .name("qlbuilder")
    .usage("command [environment name]")
    .version(version, "-v, --version", "Output the current version");

  program
    .command("create [name]")
    .option(
      "-t",
      "Creates .vscode folder with pre-defined tasks.json and settings.json"
    )
    .description("Create new project folder structure")
    .action(async function (projectName, options) {
      await create(projectName, options);
    });

  program
    .command("vscode")
    .description(
      "Creates .vscode folder with pre-defined tasks.json and settings.json"
    )
    .action(() => vsCode());

  program
    .command("setscript [env]")
    .description("Build and set the script")
    .option("-a", "Set the same script to all additional apps as well")
    .option("-d", "Debug. Write out enigma traffic messages")
    .action(async function (envName, options) {
      await setScript(envName, options);
    });

  program
    .command("getscript [env]")
    .description(
      "Get the script from the target Qlik app and overwrite the local script"
    )
    .option(
      "-y",
      "WARNING! Using this option will automatically overwrite the local script files without any prompt"
    )
    .option("-d", "Debug. Write out enigma traffic messages")
    .action(async function (envName, options) {
      await getScript(envName, options);
    });

  program
    .command("checkscript [env]")
    .description("Check local script for syntax errors")
    .option("-d", "Debug. Write out enigma traffic messages")
    .action(async function (envName, options) {
      await checkScript(envName, options);
    });

  program
    .command("watch [env]")
    .description("Start qlBuilder in watch mode")
    .option("-r", "Reload and save on each file change")
    .option("-s", "Set script and save app on each file change")
    .option("-de", "Disable the auto syntax error check")
    .option("-d", "Debug. Write out enigma traffic messages")
    .action(async function (envName, options) {
      await watch(envName, options);
    });

  program
    .command("build")
    .description("Combine the tab script files into one")
    .action(async function () {
      await build();
    });

  program
    .command("reload [env]")
    .description("Set script and reload the target app")
    .option("-d", "Debug. Write out enigma traffic messages")
    .action(async function (envName, options) {
      await reload(envName, options);
    });

  program
    .command("download [env]")
    .requiredOption("-p, --path <path>", "Location to save the file")
    .option("-nd, --nodata <boolean>", "Download the qvf without data", "false")
    .description("Download the qvf")
    .action(async function (envName, options) {
      if (options.nodata != "false" && options.nodata != "true") {
        writeLog(
          "err",
          `Invalid value for "-nodata" parameter. Provided "${options.nodata}" but expected "true" or "false"`
        );
        process.exit(0);
      }

      const downloadResponse = await download(envName, options);

      writeLog(
        downloadResponse.error ? "err" : "ok",
        downloadResponse.message,
        true
      );
    });

  program.on("--help", function () {
    console.log("");
    console.log("Examples:");
    console.log(" > qlbuilder setscript desktop");
    console.log(" > qlbuilder getscript desktop");
    console.log(" > qlbuilder reload desktop");
    console.log(" > qlbuilder watch desktop -r");
    console.log(" > qlbuilder watch desktop -s");
    console.log(" > qlbuilder download desktop -p c:/path/to/folder");
    console.log(
      " > qlbuilder download desktop -p c:/path/to/folder --nodata true"
    );
    console.log("");
    console.log("More info: https://github.com/informatiqal/qlBuilder");
    console.log("");
  });

  program.on("command:*", function () {
    console.error(
      "Invalid command: %s\nSee --help for a list of available commands.",
      program.args.join(" ")
    );
    process.exit(1);
  });

  program.parse(process.argv);
})();
