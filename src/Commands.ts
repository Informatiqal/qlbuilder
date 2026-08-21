import { program } from "commander";
import {
  loadExternalPlugins,
  loadInternalPlugins,
} from "./lib/plugins/loader.js";

export class Commander {
  programs = program;

  constructor() {
    this.init();
    this.onHelp();
    this.onUnknownArg();
  }

  async loadPlugins() {
    const [internalPLugins, externalPlugins] = await Promise.all([
      loadInternalPlugins(),
      loadExternalPlugins(),
    ]);

    [...internalPLugins, ...externalPlugins].map((command) => {
      this.programs.addCommand(command);
    });
  }

  private init() {
    this.programs.name("qlbuilder");
    this.programs.usage("command [environment name]");
    this.programs.version(
      "__VERSION",
      "-v, --version",
      "Output the current version",
    );

    this.programs.configureHelp({
      sortSubcommands: true,
    });
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
        " > qlbuilder download desktop -p c:/path/to/folder\n",
      );
      process.stdout.write(
        " > qlbuilder download desktop -p c:/path/to/folder --nodata true\n",
      );
      process.stdout.write("\n");
      process.stdout.write("To get additional info for a specific command:\n");
      process.stdout.write(" > qlbuilder some-command --help\n");
      process.stdout.write("\n");
      process.stdout.write(
        "More info: https://github.com/informatiqal/qlBuilder\n",
      );
      process.stdout.write("\n");
    });
  }

  private onUnknownArg() {
    this.programs.on("command:*", function () {
      console.error(
        "Invalid command: %s\nSee --help for a list of available commands.",
        program.args.join(" "),
      );
      process.exit(1);
    });
  }
}
