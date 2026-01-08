import filenamify from "filenamify";
import { readdirSync, rmSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { Spin } from "../lib/Spinner";
import { GetScriptOptionValues } from "../types/types";
import { Build } from "./Build";

export class GetScript {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private session: enigmaJS.ISession;
  private spin: Spin;
  constructor(name: string, options: GetScriptOptionValues) {
    this.name = name;
    this.options = options;
    this.spin = new Spin("Getting script ..", "arc");

    const checks = new Checks();
    checks.all();

    const config = new Config(this.name);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    let overwrite: Boolean = true;
    if (!this.options.y) overwrite = await this.askOverwrite();

    if (overwrite === true) {
      const auth = this.authMethod();
      await auth();

      this.spin.start();

      const loadScript = await this.retrieveQlikScript();
      await this.clearLocalFiles();
      this.writeLocalFiles(loadScript);
      const build = new Build();
      build.run();

      this.spin.stop();
      return true;
    }

    this.spin.stop();
    return false;
  }

  private authMethod() {
    // QS desktop. Ignore any auth props (present or not)
    if (this.environment.host.indexOf(":4848") > -1) return this.auth.desktop;

    // for anything else raise an error
    if (!this.auth[this.environment.authentication.type])
      throw new CustomError(
        `Invalid authentication method - ${this.environment.authentication.type}`,
        "error",
        true
      );

    return () => this.auth[this.environment.authentication.type]();
  }

  private async askOverwrite() {
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
        }
      )
    );
  }

  private async retrieveQlikScript() {
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug
    );

    this.session = qlik.session;

    let loadScript = "";

    try {
      const global = await qlik.session.open<EngineAPI.IGlobal>();
      const doc = await global.openDoc(this.environment.appId);
      loadScript = await doc.getScript();
    } catch (e) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }

    try {
      await this.session.close();
    } catch (e) {}

    return loadScript.split("///$tab ");
  }

  private async clearLocalFiles() {
    try {
      readdirSync(`${process.cwd()}/src`).forEach((f) =>
        rmSync(`${process.cwd()}/src/${f}`)
      );
    } catch (e) {
      try {
        await this.session.close();
      } catch (e) {}

      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }

  private writeLocalFiles(scriptTabs) {
    try {
      for (let [i, tab] of scriptTabs.entries()) {
        if (tab.length > 0) {
          const rows = tab.split("\r\n");
          const tabName = rows[0];
          const tabNameSafe = filenamify(tabName, { replacement: "" });

          const scriptContent = rows.slice(1, rows.length).join("\r\n");

          writeFileSync(
            `${process.cwd()}/src/${i}--${tabNameSafe}.qvs`,
            scriptContent
          );
        }
      }
    } catch (e) {
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }
}
