import { readdirSync, readFileSync, writeFileSync } from "fs";
import { Checks } from "../lib/Checks";
import { orderBy } from "natural-orderby";
import { Spin } from "../lib/Spinner";

export class Build {
  builtScript: string = "";
  private srcParentFolder: string;
  private spin: Spin;
  constructor(srcFolder?: string, isCreateCommand?: boolean) {
    this.srcParentFolder = srcFolder ? srcFolder : process.cwd();
    this.spin = new Spin("Building the script", "hamburger");

    if (!isCreateCommand) {
      const checks = new Checks();
      checks.srcAndDistExists();
    }
  }

  run() {
    this.spin.start();
    const scriptFiles = orderBy(
      readdirSync(`${this.srcParentFolder}/src`).filter(
        (f) => f.indexOf(".qvs") > -1
      )
    );

    this.builtScript = scriptFiles
      .map((s) => {
        const tabName = s.replace(".qvs", "").split("--")[1];
        const fileContent = readFileSync(
          `${this.srcParentFolder}/src/${s}`
        ).toString();

        return `///$tab ${tabName}\r\n${fileContent}`;
      })
      .join(`\n\n`);

    writeFileSync(
      `${this.srcParentFolder}/dist/LoadScript.qvs`,
      this.builtScript,
      "utf-8"
    );

    this.spin.stop();
  }
}
