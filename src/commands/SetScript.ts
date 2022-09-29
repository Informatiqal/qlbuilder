import { Spin } from "../lib/Spinner";
import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { Print } from "../lib/Print";
import { GetScriptOptionValues } from "../types/types";
import { Build } from "./Build";

export class SetScript {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private spin: Spin;
  constructor(name: string, options: GetScriptOptionValues) {
    this.name = name;
    this.options = options;

    this.spin = new Spin("Setting the script and saving ...", "arc");

    const checks = new Checks();
    checks.all();

    const config = new Config(this.name);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    const build = new Build();
    build.run();

    const auth = this.authMethod();
    await auth();

    this.spin.start();

    await this.setScript(build.builtScript);

    this.spin.stop();

    const print = new Print();
    print.ok("Load script was set");

    return;
  }

  private authMethod() {
    // QS desktop. Ignore any auth props (present or not)
    if (this.environment.host.indexOf(":4848")) return this.auth.desktop;

    // for anything else raise an error
    if (!this.auth[this.environment.authentication.type])
      throw new CustomError(
        `Invalid authentication method - ${this.environment.authentication.type}`,
        "error",
        true
      );

    return this.auth[this.environment.authentication.type];
  }

  private async setScript(script: string) {
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
      await app.doSave();
      await qlik.session.close();
    } catch (e) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }
}
