import { writeFileSync } from "fs";
import { Auth } from "../lib/Auth.js";
import { Checks } from "../lib/Checks.js";
import { Config, IConfig } from "../lib/Config.js";
import { CustomError } from "../lib/CustomError.js";
import { Engine } from "../lib/Engine.js";
import { AppDetailsOptions } from "../types/types.js";
import { Spin } from "../lib/Spinner.js";

export class TablesAndFields {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: AppDetailsOptions;
  //@ts-ignore
  private spin: Spin;
  script: string = "";
  constructor(name: string, options?: AppDetailsOptions) {
    this.name = name;
    this.options = options ?? ({} as AppDetailsOptions);
    this.spin = new Spin("Checking for syntax errors ...", "hamburger");

    const checks = new Checks();
    checks.all();

    const config = new Config(this.name, this.options.config.trim());
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    const auth = this.authMethod();
    await auth();

    this.spin.start();

    await this.getTablesAndFields();

    this.spin.stop();
  }

  private authMethod() {
    // QS desktop. Ignore any auth props (present or not)
    if (this.environment.host.indexOf(":4848") > -1) return this.auth.desktop;

    // for anything else raise an error
    if (!this.auth[this.environment.authentication.type])
      throw new CustomError(
        `Invalid authentication method - ${this.environment.authentication.type}`,
        "error",
        true,
      );

    return () => this.auth[this.environment.authentication.type]();
  }

  private async getTablesAndFields() {
    const _this = this;
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug,
    );

    try {
      const global = await qlik.session.open<EngineAPI.IGlobal>();
      const doc = await global.openDoc(this.environment.appId);

      const tablesAndKeys = await doc.getTablesAndKeys({}, {}, 0, true, false);
      await qlik.session.close();

      const displayData: string[] = [];

      tablesAndKeys.qtr.map(function (t) {
        const tags = t.qTableTags.length > 0 ? t.qTableTags.join(", ") : "-";
        const rows = parseInt(t.qNoOfRows).toLocaleString();

        displayData.push(t.qName);
        displayData.push(`\tRows: ${rows}`);
        displayData.push(`\tTags: ${tags}`);
        displayData.push("\t----------------");

        t.qFields.map(function (f) {
          const tags = f.qTags.length > 0 ? f.qTags.join(", ") : "-";
          const rows = parseInt(f.qnRows).toLocaleString();
          const isKey = f.qKeyType == "NOT_KEY" ? false : true;

          displayData.push(`\t${f.qName}`);
          if (isKey) displayData.push(`\t\tKey            : ${f.qKeyType}`);
          displayData.push(`\t\tRows           : ${rows}`);
          displayData.push(`\t\tDistinct values: ${f.qnTotalDistinctValues}`);
          displayData.push(`\t\tNon null values: ${f.qnNonNulls}`);
          displayData.push(`\t\tTags           : ${tags}`);
        });

        displayData.push("");
      });

      console.log(displayData.join("\n"));

      if (_this.options.output) {
        try {
          writeFileSync(_this.options.output, displayData.join("\n"));
        } catch (e: any) {
          throw new Error(e.message);
        }
      }
    } catch (e: any) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }
}
