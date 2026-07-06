import { readdirSync, readFileSync, writeFileSync } from "fs";
import { orderBy } from "natural-orderby";

import { PluginMeta } from "../../types/types.js";
import { srcAndDistExists } from "../../lib/checks.js";
import { Print } from "../../lib/Print.js";

const meta: PluginMeta = {
  command: {
    name: "build",
    description: "Combine the tab script files into one",
    aliases: [],
    options: [],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
  },
};

async function action(folder: string = "", performChecks: boolean = true) {
  const print = new Print();
  if (performChecks == true) srcAndDistExists();

  const srcParentFolder = folder.length > 0 ? folder : process.cwd();

  const scriptFiles = orderBy(
    readdirSync(`${srcParentFolder}/src`).filter((f) => f.indexOf(".qvs") > -1),
  );

  const builtScript = scriptFiles
    .map((s) => {
      const tabName = s.replace(".qvs", "").split("--")[1];
      const fileContent = readFileSync(
        `${srcParentFolder}/src/${s}`,
      ).toString();

      return `///$tab ${tabName}\r\n${fileContent}`;
    })
    .join(`\n\n`);

  writeFileSync(`${srcParentFolder}/dist/LoadScript.qvs`, builtScript, "utf-8");

  print.ok("Load script created and saved (locally)");

  return builtScript;
}

export { meta, action };
