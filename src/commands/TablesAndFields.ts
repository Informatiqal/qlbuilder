import { writeFileSync } from "fs";
import { Auth } from "../lib/Auth.js";
import { Checks } from "../lib/Checks.js";
import { Config, IConfig } from "../lib/Config.js";
import { CustomError } from "../lib/CustomError.js";
import { Engine } from "../lib/Engine.js";
import { AppDetailsOptions, TablesAndFieldsProcessed } from "../types/types.js";
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

    const processedData = await this.getTablesAndFields();

    if (
      this.options.output &&
      this.options.output.toLowerCase().endsWith("md")
    ) {
      const mdData = await this.formatMarkdown(processedData);
      try {
        writeFileSync(this.options.output, mdData.join("\n"));
      } catch (e: any) {
        throw new Error(e.message);
      }
    }

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

      const tablesAndKeys = await doc
        .getTablesAndKeys({}, {}, 0, true, false)
        .then((d) =>
          d.qtr.sort((a, b) => {
            return a["qName"].localeCompare(b["qName"]);
          }),
        );

      await qlik.session.close();

      const displayData: string[] = [];

      const d: TablesAndFieldsProcessed = {};

      tablesAndKeys.map(function (t) {
        const tags = t.qTableTags.length > 0 ? t.qTableTags.join(", ") : "-";
        const rows = parseInt(t.qNoOfRows).toLocaleString();

        displayData.push(t.qName);
        displayData.push(`\tRows: ${rows}`);
        displayData.push(`\tTags: ${tags}`);
        displayData.push("\t----------------");

        d[t.qName] = { table: { rows, tags }, fields: {} };

        const fieldsSorted = t.qFields.sort((a, b) => {
          return a["qName"].localeCompare(b["qName"]);
        });

        fieldsSorted.map(function (f) {
          const rows = parseInt(f.qnRows).toLocaleString();
          const distinctValues = parseInt(
            f.qnTotalDistinctValues,
          ).toLocaleString();
          const nonNulls = parseInt(f.qnNonNulls).toLocaleString();
          const isKey = f.qKeyType == "NOT_KEY" ? false : true;

          displayData.push(`\t${f.qName}`);
          if (isKey) displayData.push(`\t\tKey            : ${f.qKeyType}`);
          displayData.push(`\t\tRows           : ${rows}`);
          displayData.push(`\t\tDistinct values: ${distinctValues}`);
          displayData.push(`\t\tNon null values: ${nonNulls}`);
          if (f.qTags.length > 0)
            displayData.push(`\t\tTags           : ${f.qTags.join(", ")}`);

          d[t.qName].fields[f.qName] = {
            keyType: f.qKeyType,
            rows,
            distinctValues,
            nonNulls,
            tags: f.qTags,
          };
        });

        displayData.push("");
      });

      console.log(displayData.join("\n"));

      if (
        _this.options.output &&
        !_this.options.output.toLowerCase().endsWith("md")
      ) {
        try {
          writeFileSync(_this.options.output, displayData.join("\n"));
        } catch (e: any) {
          throw new Error(e.message);
        }
      }

      return d;
    } catch (e: any) {
      await qlik.session.close();
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    }
  }

  private formatMarkdown(data: TablesAndFieldsProcessed) {
    const mdContent = ["# TABLES AND FIELDS", ""];

    // tables list for ToC
    mdContent.push(`| Table name | Rows | Fields |`);
    mdContent.push(`|------------|------|--------|`);

    Object.entries(data).map(([t, v]) => {
      // mdContent.push(`- [${t}](#${t.toLowerCase().replace(/ /g,"-")})`),
      mdContent.push(
        ` | [${t}](#${t.toLowerCase().replace(/ /g, "-")}) | ${v.table.rows} | ${Object.keys(v.fields).length}`,
      );
    });

    mdContent.push("");

    Object.entries(data).map(([t, v]) => {
      mdContent.push(`## ${t}`);
      mdContent.push("");
      mdContent.push(`Rows: ${v.table.rows}`);
      if (v.table.tags != "-") mdContent.push(`Tags: ${v.table.tags}`);
      mdContent.push("");
      mdContent.push(
        `| Field name | Rows | Distinct values | Non null values | Key | Tags |`,
      );
      mdContent.push(
        `|------------|------|-----------------|-----------------|-----|------|`,
      );

      Object.entries(v.fields).map(([f, v]) => {
        const key = v.keyType == "NOT_KEY" ? "" : v.keyType;
        mdContent.push(
          `| ${f} | ${v.rows} | ${v.distinctValues} | ${v.nonNulls} | ${key} | ${v.tags.join(", ")} |`,
        );
      });

      mdContent.push("");
    });

    return mdContent;
  }
}
