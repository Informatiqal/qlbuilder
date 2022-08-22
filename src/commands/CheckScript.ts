import { readFileSync, readdirSync } from "fs";
import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { Print } from "../lib/Print";
import { GetScriptOptionValues } from "../types/types";
import { Build } from "./Build";
import { Spin } from "../lib/Spinner";

export class CheckScript {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private scriptErrors: EngineAPI.IScriptSyntaxError[];
  private spin: Spin;
  script: string;
  constructor(name: string, options?: GetScriptOptionValues) {
    this.name = name;
    this.options = options;
    this.spin = new Spin("Checking for syntax errors ...", "hamburger");

    const checks = new Checks();
    checks.all();

    const config = new Config(this.name);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    this.spin.start();

    const build = new Build();
    build.run();
    this.script = build.builtScript;

    await this.auth[this.environment.authentication.type]();

    await this.setScriptAndCheckSyntax(build.builtScript);

    if (this.scriptErrors.length == 0) {
      const print = new Print();
      print.ok("No syntax errors were found");
      this.spin.stop();
      return 0;
    }

    await this.displayScriptErrors();

    this.spin.stop();
    return this.scriptErrors.length;
  }

  private async setScriptAndCheckSyntax(script: string) {
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug
    );

    try {
      const global = await qlik.session.open<EngineAPI.IGlobal>();
      const app = await global.createSessionApp();
      await app.setScript(script);
      const checkSyntax = await app.checkScriptSyntax();
      await qlik.session.close();
      this.scriptErrors = checkSyntax;
    } catch (e) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }

  private displayScriptErrors() {
    const scriptFiles = readdirSync(`${process.cwd()}/src`).filter(function (
      f
    ) {
      return f.indexOf(".qvs") > -1;
    });

    for (let scriptError of this.scriptErrors) {
      const tabScript = readFileSync(
        `${process.cwd()}/src/${scriptFiles[scriptError.qTabIx]}`
      )
        .toString()
        .split("\n");

      console.log(`
    Tab : ${scriptFiles[scriptError.qTabIx]} 
    Line: ${scriptError.qLineInTab} 
    Code: ${tabScript[scriptError.qLineInTab - 1]}`);
    }
  }
}
