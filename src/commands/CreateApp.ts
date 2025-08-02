import { readFileSync, writeFileSync } from "fs";
import { dump, load as yamlLoad } from "js-yaml";
import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { Spin } from "../lib/Spinner";
import { GetScriptOptionValues } from "../types/types";
import { Build } from "./Build";
import { Print } from "../lib/Print";

export interface ICreateAppResponse {
  qSuccess: boolean;
  qAppId: string;
}

export class CreateApp {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private session: enigmaJS.ISession;
  private spin: Spin;
  private print: Print;
  constructor(name: string, env: string, options: GetScriptOptionValues) {
    this.print = new Print();
    this.name = name;
    this.options = options;
    this.spin = new Spin("Creating new app ...", "arc");

    const checks = new Checks();
    checks.configFileExists();
    checks.environmentExists();

    const config = new Config(env);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    const auth = this.authMethod();
    await auth();

    this.spin.start();

    const newApp = await this.createNewApp();
    this.print.ok(`App "${this.name}" was created with ID "${newApp.qAppId}"`);

    this.updateConfig(newApp.qAppId);
    this.print.ok(`config.yml updated with the new app id`);

    const build = new Build();
    build.run();

    this.spin.stop();
    return true;
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

  private async createNewApp() {
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug
    );

    this.session = qlik.session;

    let doc = {} as ICreateAppResponse;

    try {
      const global = await qlik.session.open<EngineAPI.IGlobal>();
      doc = <ICreateAppResponse>await global.createApp(this.name);

      if (!doc.qSuccess)
        throw new CustomError("Error while creating an app", "error", true);
    } catch (e) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }

    try {
      await this.session.close();
    } catch (e) {}

    return doc;
  }

  private updateConfig(appId: string) {
    const configContent = yamlLoad(
      readFileSync(`${process.cwd()}/config.yml`).toString()
    ) as IConfig[];

    const envIndex = configContent.findIndex(
      (env) => env.name == this.environment.name
    );

    configContent[envIndex].appId = appId;

    writeFileSync(
      `${process.cwd()}/config1.yml`,
      `# yaml-language-server: $schema=https://github.com/Informatiqal/qlbuilder/blob/master/src/schema/config.json?raw=true\n${dump(
        configContent
      )}`
    );

    return true;
  }
}
