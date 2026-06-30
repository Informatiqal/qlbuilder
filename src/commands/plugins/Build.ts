import { readdirSync, readFileSync, writeFileSync } from "fs";
import { orderBy } from "natural-orderby";
import { Checks } from "../../lib/Checks.js";

import { PluginArguments, PluginMeta } from "../../types/types.js";

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

async function action(args: PluginArguments) {
  const print = new args.tools.print();
  const spin = new args.tools.spinner("Building the script", "hamburger");
  //   if (!isCreateCommand) {
  const checks = new Checks();
  checks.srcAndDistExists();
  //   }

  const srcParentFolder = process.cwd();

  spin.start();
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

  spin.stop();

  print.ok("Load script created and saved (locally)");
}

export { meta, action };
