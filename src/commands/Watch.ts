import chalk from "chalk";
import { FSWatcher, watch } from "chokidar";
import { createInterface } from "readline";
import { WatchOptionValues } from "../types/types";
import { CheckScript } from "./CheckScript";
import { SetScript } from "./SetScript";
import { Reload } from "./Reload";
import { Checks } from "../lib/Checks";

export class Watch {
  private name: string;
  private options: WatchOptionValues;
  private watcher: FSWatcher;
  constructor(name: string, options: WatchOptionValues) {
    this.name = name;
    this.options = options;

    const checks = new Checks();
    checks.all();

    this.commandsMessage();

    if (options.reload) this.reloadMessage();

    if (options.disable) this.disableChecks();

    this.watcher = watch(`${process.cwd()}/src/*.qvs`, {
      ignorePermissionErrors: true,
      awaitWriteFinish: true,
      ignoreInitial: true,
      depth: 0,
    });
  }

  async run() {
    const _this = this;
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("qlBuilder> ");
    rl.prompt();

    rl.on("line", async function (line) {
      const result = await _this.parseLine(line.toLowerCase());

      rl.prompt();
    });

    this.watcher.on("change", async function (fileName) {
      await _this.checkScript();

      if (!_this.options.reload && _this.options.set) {
        await _this.setScript();
      }

      if (_this.options.reload) {
        await _this.reload();
      }

      rl.prompt();
    });
  }

  private commandsMessage() {
    const commands = [
      "\n",
      "Commands during watch mode:\n",
      "    - set script: s or set\n",
      // "    - set script to all apps: sa or setall\n",
      "    - reload app: r or rl\n",
      "    - clear console: c or cls\n",
      "    - check for syntax errors: e or err\n",
      "    - show this message again: ?\n",
      "    - exit - x\n",
      "(script is checked for syntax errors every time one of the qvs files is saved)\n",
    ].join("");

    console.log(commands);
  }

  private reloadMessage() {
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

  private disableChecks() {
    return chalk.yellow(
      `Auto syntax checks is disabled! Please use "e" or "err" anytime syntax check is required`
    );
  }

  private async parseLine(line: string) {
    if (line === "?") return this.commandsMessage();

    if (line === "x") {
      process.stdout.write("\u001b[2J\u001b[0;0H");
      console.log("Bye!");
      process.exit(0);
    }

    if (line === "c" || line === "cls") {
      process.stdout.write("\u001b[2J\u001b[0;0H");
      return;
    }

    if (line === "e" || line === "err") {
      await this.checkScript();
      return;
    }

    if (line === "s" || line === "set") {
      await this.setScript();
      return;
    }

    if (line === "sa" || line === "setall") {
      await this.setAll();
      return;
    }

    if (line === "r" || line === "rl") {
      await this.reload();
      return;
    }

    console.log(`Unknown command "${line}"`);
  }

  private async checkScript() {
    const checkScript = new CheckScript(this.name, {
      debug: this.options.debug,
    });

    await checkScript.run().catch((e) => console.log(e.message));
  }

  private async setScript() {
    const setScript = new SetScript(this.name, { debug: this.options.debug });

    await setScript.run().catch((e) => console.log(e));
  }

  private async setAll() {
    console.log("TBA");
  }

  private async reload() {
    const reload = new Reload(this.name, { debug: this.options.debug });

    await reload.run().catch((e) => console.log(e.message));
  }
}
