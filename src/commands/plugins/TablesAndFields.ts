import { writeFileSync } from "fs";

import {
  PluginArguments,
  PluginMeta,
  TablesAndFieldsProcessed,
} from "../../types/types.js";
import { CustomError } from "../../lib/CustomError.js";

const meta: PluginMeta = {
  command: {
    name: "tables",
    description: "Print details for the tables and fields in the app",
    aliases: ["fields", "tablesAndFields"],
    options: [
      {
        flag: "--output <path>",
        description:
          "Optional. Path. Save the output to a file. (Console output is still shown). If file ends in .md the file content will be formatted as markdown",
        defaultValue: undefined,
      },
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
    ],
  },
  options: {
    requireConnection: true,
    requireEnv: true,
    requireApp: true,
  },
};

async function action(args: PluginArguments) {
  const spin = new args.tools.spinner("Getting tables and fields", "circle");

  spin.start();
  
  const processedData = await getTablesAndFields(
    args.engine.session,
    args.engine.app,
  );

  spin.stop();

  console.log(processedData.displayData.join("\n"));

  if (args.command.options.output) {
    if (!(args.command.options.output as string).toLowerCase().endsWith("md")) {
      try {
        writeFileSync(
          args.command.options.output as string,
          processedData.displayData.join("\n"),
        );
      } catch (e: any) {
        throw new Error(e.message);
      }
    } else {
      try {
        const mdData = await formatMarkdown(processedData.tablesAndFields);
        writeFileSync(args.command.options.output as string, mdData.join("\n"));
      } catch (e: any) {
        throw new Error(e.message);
      }
    }
  }
}

async function getTablesAndFields(session, app) {
  try {
    const tablesAndKeys = await app
      .getTablesAndKeys({}, {}, 0, true, false)
      .then((d) =>
        d.qtr.sort((a, b) => {
          return a["qName"].localeCompare(b["qName"]);
        }),
      );

    await session.close();

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

      return d;
    });

    return { displayData, tablesAndFields: d };
  } catch (e: any) {
    await session.close();
    // this.spin.stop();
    throw new CustomError(e.message, "error", true);
  }
}

function formatMarkdown(data: TablesAndFieldsProcessed) {
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

export { meta, action };
