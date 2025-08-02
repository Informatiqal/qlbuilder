import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { Spin } from "../lib/Spinner";
import { GetScriptOptionValues } from "../types/types";
import { Print } from "../lib/Print";

export interface ICreateAppResponse {
  qSuccess: boolean;
  qAppId: string;
}

export interface qMeta {
  canCreateDataConnections: boolean;
  createdDate: string;
  description: string;
  dynamicColor: string;
  modifiedDate: string;
  published: boolean;
  publishTime?: string;
  stream?: {
    id: string;
    name: string;
  };
}

export class AppDetails {
  private auth: Auth;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private session: enigmaJS.ISession;
  private spin: Spin;
  private print: Print;
  constructor(env: string, options: GetScriptOptionValues) {
    this.print = new Print();
    this.options = options;
    this.spin = new Spin("Getting app metadata ...", "arc");

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

    const details = await this.getAppDetails();
    this.printDetails(details);

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

  private async getAppDetails() {
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug
    );

    this.session = qlik.session;

    let details = {} as EngineAPI.IAppEntry;

    try {
      const global = await qlik.session.open<EngineAPI.IGlobal>();
      details = await global.getAppEntry(this.environment.appId);
    } catch (e) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }

    try {
      await this.session.close();
    } catch (e) {}

    return details;
  }

  printDetails(details: EngineAPI.IAppEntry) {
    console.log("");
    console.log(`ID                : ${details.qID}`);
    console.log(`Name              : ${details.qTitle}`);
    console.log(
      `Size              : ${this.formatBytes((details as any).qFileSize)}`
    );
    console.log(`Published         : ${(details.qMeta as qMeta).published}`);

    if ((details.qMeta as qMeta).published) {
      console.log(`Stream ID         : ${(details.qMeta as qMeta).stream.id}`);
      console.log(
        `Stream name       : ${(details.qMeta as qMeta).stream.name}`
      );
      console.log(
        `Publish time      : ${(details.qMeta as qMeta).publishTime}`
      );
    }

    console.log(`Created date      : ${(details.qMeta as qMeta).createdDate}`);
    console.log(`Last modified date: ${(details.qMeta as qMeta).modifiedDate}`);
    console.log(`Last reload date  : ${details.qLastReloadTime}`);

    if ((details.qMeta as qMeta).description) {
      console.log(
        `Description       : ${(details.qMeta as qMeta).description}`
      );
    }
    console.log("");
  }

  private formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
