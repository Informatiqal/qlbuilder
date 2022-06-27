import { program, Command, createArgument } from "commander";
import { Print } from "./lib/Print";
import { version } from "../package.json";
import { Build } from "./commands/Build";
import { Create } from "./commands/Create";
import { Download } from "./commands/Download";
import {
  DownloadOptionValues,
  GetScriptOptionValues,
  WatchOptionValues,
} from "./types/types";
import { GetScript } from "./commands/GetScript";
import { CheckScript } from "./commands/CheckScript";
import { SetScript } from "./commands/SetScript";
import { Reload } from "./commands/Reload";
import { Watch } from "./commands/Watch";

export class Commander {
  programs = program;
  print = new Print();

  constructor() {
    this.init();

    this.programs.addCommand(this.build());
    this.programs.addCommand(this.create());
    this.programs.addCommand(this.download());
    this.programs.addCommand(this.getScript());
    this.programs.addCommand(this.checkScript());
    this.programs.addCommand(this.setScript());
    this.programs.addCommand(this.vsCode());
    this.programs.addCommand(this.reload());
    this.programs.addCommand(this.watch());

    this.onHelp();
    this.onUnknownArg();
  }

  private init() {
    this.programs.name("qlbuilder");
    this.programs.usage("command [environment name]");
    this.programs.version(
      version,
      "-v, --version",
      "Output the current version"
    );
  }

  private build() {
    const _this = this;
    const comm = new Command("build");
    comm.description("Combine the tab script files into one");
    comm.action(function () {
      try {
        const build = new Build();
        build.run();

        _this.print.ok("Load script created and saved (locally)");
      } catch (e) {
        _this.print.error(e.message);
        process.exit(1);
      }
    });

    return comm;
  }

  private download() {
    const _this = this;
    const comm = new Command("download");
    comm.description("Download the configured qvf");

    comm.argument("<env>");

    comm.option(
      "-nd, --nodata <boolean>",
      "Download the qvf without data",
      "false"
    );
    comm.requiredOption("-p, --path <path>", "Location to save the file");

    comm.action(async function (environment, options: DownloadOptionValues) {
      const download = new Download(environment, options);

      const fileName = await download.run();

      _this.print.ok(
        `"${fileName}" was saved in "${options.path}" ${
          options.nodata ? "(without data)" : ""
        }`
      );
    });

    return comm;
  }

  private getScript() {
    const _this = this;
    const comm = new Command("getScript");
    comm.alias("getscript");
    comm.description(
      "Get the script from the target Qlik app and overwrite the local script"
    );

    comm.argument("<env>");

    comm.option(
      "-y",
      "WARNING! Using this option will automatically overwrite the local script files without any prompt"
    );

    comm.option(
      "-d, --debug",
      "Debug. Write out enigma traffic messages",
      false
    );

    comm.action(async function (name, options: GetScriptOptionValues) {
      const getScript = new GetScript(name, options);
      const res = await getScript.run();

      if (res == true) _this.print.ok("Local script files were created");
      if (res == false) _this.print.warn("Nothing was changed");
    });

    return comm;
  }

  private checkScript() {
    const _this = this;
    const comm = new Command("checkScript");
    comm.alias("checkscript");
    comm.description(
      "Check the local script for syntax errors against Qlik session app"
    );

    comm.argument("<env>");

    comm.option(
      "-d, --debug",
      "Debug. Write out enigma traffic messages",
      false
    );

    comm.action(async function (name, options: GetScriptOptionValues) {
      const checkScript = new CheckScript(name, options);
      await checkScript.run();
      process.exit(0);
    });

    return comm;
  }

  private setScript() {
    const _this = this;
    const comm = new Command("setScript");
    comm.alias("setscript");
    comm.description("Build and set the script");

    comm.argument("<env>");

    comm.option(
      "-d, --debug",
      "Debug. Write out enigma traffic messages",
      false
    );

    comm.action(async function (name, options: GetScriptOptionValues) {
      const setScript = new SetScript(name, options);
      await setScript.run();
      process.exit(0);
    });

    return comm;
  }

  private create() {
    const _this = this;
    const comm = new Command("create");
    comm.argument("<name>");
    comm.option(
      "-t, --tasks",
      "Create .vscode folder with pre-setup VSCods tasks"
    );
    comm.description("Create new project structure in the current directory");
    comm.action(function (name: string, options: any) {
      const createVSCodeStructure =
        options && options.tasks == true ? true : false;

      try {
        const create = new Create(name, createVSCodeStructure);
        create.run();

        _this.print.ok("All set");
      } catch (e) {
        _this.print.error(e.message);
        process.exit(1);
      }
    });

    return comm;
  }

  private vsCode() {
    const _this = this;
    const comm = new Command("vscode");
    comm.description(
      "Creates .vscode folder with pre-defined tasks.json and settings.json"
    );

    comm.action(async function () {
      const create = new Create("", true);
      create.createVSCodeTasks();

      _this.print.ok(".vscode folder was created");
      process.exit(0);
    });

    return comm;
  }

  private reload() {
    const _this = this;
    const comm = new Command("reload");
    comm.alias("Reload");
    comm.description("Set script and reload the target app");

    comm.argument("<env>");

    comm.option(
      "-d, --debug",
      "Debug. Write out enigma traffic messages",
      "false"
    );

    comm.action(async function (name, options: GetScriptOptionValues) {
      const reload = new Reload(name, options);
      await reload.run().catch((e) => process.exit(1));

      _this.print.ok("Reloaded");
      process.exit(0);
    });

    return comm;
  }

  private watch() {
    const _this = this;
    const comm = new Command("watch");
    comm.alias("Watch");
    comm.description("Start qlBuilder in watch mode");

    comm.option("-r, --reload", "Reload and save on each file change");
    comm.option("-s, --set", "Set script and save app on each file change");
    comm.option("-de, --disable", "Disable the auto syntax error check");
    comm.option(
      "-d, --debug",
      "Debug. Write out enigma traffic messages",
      "false"
    );

    comm.argument("<env>");

    comm.action(async function (name, options: WatchOptionValues) {
      const watch = new Watch(name, options);
      await watch.run();

      // process.exit(0);
    });

    return comm;
  }

  private onHelp() {
    this.programs.on("--help", function () {
      process.stdout.write("\n");
      process.stdout.write("Examples:\n");
      process.stdout.write(" > qlbuilder setscript desktop\n");
      process.stdout.write(" > qlbuilder getscript desktop\n");
      process.stdout.write(" > qlbuilder reload desktop\n");
      process.stdout.write(" > qlbuilder watch desktop -r\n");
      process.stdout.write(" > qlbuilder watch desktop -s\n");
      process.stdout.write(
        " > qlbuilder download desktop -p c:/path/to/folder\n"
      );
      process.stdout.write(
        " > qlbuilder download desktop -p c:/path/to/folder --nodata true\n"
      );
      process.stdout.write("\n");
      process.stdout.write(
        "More info: https://github.com/informatiqal/qlBuilder\n"
      );
      process.stdout.write("\n");
    });
  }

  private onUnknownArg() {
    this.programs.on("command:*", function () {
      console.error(
        "Invalid command: %s\nSee --help for a list of available commands.",
        program.args.join(" ")
      );
      process.exit(1);
    });
  }
}
