import { readdirSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { PluginArguments, PluginMeta } from "../../types/types.js";
import prompts from "prompts";
import { orderBy } from "natural-orderby";
import { srcFolderExists } from "../../lib/checks.js";

type CommandOptions = {};

const meta: PluginMeta = {
  command: {
    name: "section",
    description: "Manage script sections",
    aliases: [],
    argument: "operation",
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
    ],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

let existingSections: string[] = [];
let build;
let print;

async function action(args: PluginArguments<CommandOptions>) {
  existingSections = orderBy(readdirSync(`${process.cwd()}/src`));
  build = args.tools.build;
  print = new args.tools.print();

  if (args.command.argument?.toLowerCase() == "add") await add();
  if (args.command.argument?.toLowerCase() == "remove") await remove();
  if (args.command.argument?.toLowerCase() == "move") await move();
  if (args.command.argument?.toLowerCase() == "renumber") await renumber();

  return true;
}

async function add(): Promise<boolean> {
  srcFolderExists();

  const newSection: { index: number; title: string } = await prompts(
    [
      {
        type: "text",
        name: "title",
        message: "What will be the title of the new section?",
      },
      {
        type: "select",
        name: "index",
        initial: 0,
        optionsPerPage: 15,
        message: "AFTER which section to insert the new section?",
        choices: [
          "In the beginning",
          ...existingSections.map((s) => ({
            title: s,
          })),
          "At the end",
        ],
      },
    ],
    {
      onCancel: () => {
        console.log("");
        console.log("Aborted. Nothing was changed.");
        console.log("");
        process.exit(0);
      },
    },
  );

  try {
    writeFileSync(
      `${process.cwd()}/src/${newSection.index + 1}--${newSection.title}.qvs`,
      `// ${newSection.title}`,
    );
    renumberInternal(newSection, true);
    print.ok("Section added");
    build();
  } catch (e: any) {
    throw new Error(`Error while creating the section script:
${e.message}`);
  }

  return true;
}

async function remove(): Promise<boolean> {
  srcFolderExists();

  const section: { index: number[]; agree: boolean } = await prompts(
    [
      {
        type: "multiselect",
        name: "index",
        initial: 0,
        optionsPerPage: 15,
        message: "Which section to remove?",
        choices: existingSections.map((s) => ({ title: s })),
      },
      {
        type: "toggle",
        name: "agree",
        message: "Are you sure you want to delete the section(s)?",
        initial: false,
        active: "yes",
        inactive: "no",
      },
    ],
    {
      onCancel: () => {
        console.log("");
        console.log("Aborted. Nothing was changed.");
        console.log("");
        process.exit(0);
      },
    },
  );

  if (section.agree == true) {
    try {
      section.index.map((i) => {
        unlinkSync(`${process.cwd()}/src/${existingSections[i]}`);
      });
    } catch (e: any) {
      throw new Error(`Error whole removing the script section:
${e.message}`);
    }

    existingSections = orderBy(readdirSync(`${process.cwd()}/src`));
    renumber();
    print.ok("Section removed");
    build();
  }

  if (section.agree == false) {
    console.log("");
    console.log("Aborted. Nothing was changed.");
    console.log("");
    process.exit(0);
  }

  return true;
}

async function move(): Promise<boolean> {
  srcFolderExists();

  const moveSection: { index1: number; index2: number } = await prompts(
    [
      {
        type: "select",
        name: "index1",
        initial: 0,
        optionsPerPage: 15,
        message: "Which section should be moved?",
        choices: existingSections.map((s) => ({
          title: s,
        })),
      },
      {
        type: "select",
        name: "index2",
        initial: 0,
        optionsPerPage: 15,
        message: "AFTER which section to be moved?",
        choices: [
          "In the beginning",
          ...existingSections.map((s) => ({
            title: s,
          })),
          "At the end",
        ],
      },
    ],
    {
      onCancel: () => {
        console.log("");
        console.log("Aborted. Nothing was changed.");
        console.log("");
        process.exit(0);
      },
    },
  );

  const fileToRenameComponents =
    existingSections[moveSection.index1].split("--");

  const newFileName = `${moveSection.index2}--${fileToRenameComponents[1]}`;

  renumberInternal(
    { index: moveSection.index1 + 1 },
    false,
    moveSection.index2,
  );

  try {
    renameSync(
      `${process.cwd()}/src/${existingSections[moveSection.index1]}`,
      `${process.cwd()}/src/${newFileName}`,
    );

    // renumber();
    print.ok("Section moved");
    build();
  } catch (e: any) {
    throw new Error(`Error while renaming the section scripts: ${e.message}`);
  }

  return true;
}

async function renumber(): Promise<boolean> {
  srcFolderExists();

  try {
    for (let i = 0; i < existingSections.length; i++) {
      const fileComponents = existingSections[i].split("--");
      const newName = `${i + 1}--${fileComponents[1]}`;

      renameSync(
        `${process.cwd()}/src/${existingSections[i]}`,
        `${process.cwd()}/src/${newName}`,
      );
    }

    print.ok("Sections renumbered");
    build();
  } catch (e: any) {
    throw new Error(`Error while renaming the script sections:
${e.message}`);
  }

  return true;
}

function renumberInternal(
  newSection: { index: number; title?: string },
  increment: boolean,
  stopIndex?: number,
): boolean {
  const filesToRename = existingSections.slice(newSection.index, stopIndex);

  try {
    for (let file of filesToRename) {
      const fileComponents = file.split("--");
      const newName = `${
        parseInt(fileComponents[0]) + (increment ? 1 : -1)
      }--${fileComponents[1]}`;

      renameSync(
        `${process.cwd()}/src/${file}`,
        `${process.cwd()}/src/${newName}`,
      );
    }
  } catch (e: any) {
    throw new Error(`Error while renaming the script sections:
${e.message}`);
  }

  return true;
}

export { meta, action };
