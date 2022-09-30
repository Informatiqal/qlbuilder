import { readdirSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { orderBy } from "natural-orderby";
import prompts from "prompts";
import { Checks } from "../lib/Checks";
import { Build } from "./Build";

export class Section {
  private existingSections: string[] = [];
  private checks: Checks;
  private build: Build;
  constructor() {
    this.checks = new Checks();
    this.build = new Build();
  }

  init() {
    this.checks.srcFolderExists();
    this.existingScriptFiles();
  }

  private existingScriptFiles() {
    this.existingSections = orderBy(readdirSync(`${process.cwd()}/src`));
  }

  async add(): Promise<boolean> {
    this.checks.srcFolderExists();

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
            ...this.existingSections.map((s) => ({
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
      }
    );

    try {
      writeFileSync(
        `${process.cwd()}/src/${newSection.index + 1}--${newSection.title}.qvs`,
        `// ${newSection.title}`
      );
      this.renumberInternal(newSection, true);
      this.build.run();
    } catch (e) {
      throw new Error(`Error while creating the section script:
${e.message}`);
    }

    return true;
  }

  async remove(): Promise<boolean> {
    this.checks.srcFolderExists();

    const section: { index: number[]; agree: boolean } = await prompts(
      [
        {
          type: "multiselect",
          name: "index",
          initial: 0,
          optionsPerPage: 15,
          message: "Which section to remove?",
          choices: this.existingSections.map((s) => ({ title: s })),
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
      }
    );

    if (section.agree == true) {
      try {
        section.index.map((i) => {
          unlinkSync(`${process.cwd()}/src/${this.existingSections[i]}`);
        });
      } catch (e) {
        throw new Error(`Error whole removing the script section:
${e.message}`);
      }

      this.existingScriptFiles();
      this.renumber();
      this.build.run();
    }

    if (section.agree == false) {
      console.log("");
      console.log("Aborted. Nothing was changed.");
      console.log("");
      process.exit(0);
    }

    return true;
  }

  async move(): Promise<boolean> {
    this.checks.srcFolderExists();

    const moveSection: { index1: number; index2: number } = await prompts(
      [
        {
          type: "select",
          name: "index1",
          initial: 0,
          optionsPerPage: 15,
          message: "Which sections should be moved?",
          choices: this.existingSections.map((s) => ({
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
            ...this.existingSections.map((s) => ({
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
      }
    );

    const fileToRenameComponents =
      this.existingSections[moveSection.index1].split("--");
    const newFileName = `${moveSection.index2}--${fileToRenameComponents[1]}`;

    this.renumberInternal(
      { index: moveSection.index1 + 1 },
      false,
      moveSection.index2
    );

    try {
      renameSync(
        `${process.cwd()}/src/${this.existingSections[moveSection.index1]}`,
        `${process.cwd()}/src/${newFileName}`
      );

      this.build.run();
    } catch (e) {
      throw new Error(`Error while renaming the section scripts:
${e.message}`);
    }

    return true;
  }

  async renumber(): Promise<boolean> {
    this.checks.srcFolderExists();

    try {
      for (let i = 0; i < this.existingSections.length; i++) {
        const fileComponents = this.existingSections[i].split("--");
        const newName = `${i + 1}--${fileComponents[1]}`;

        renameSync(
          `${process.cwd()}/src/${this.existingSections[i]}`,
          `${process.cwd()}/src/${newName}`
        );
      }

      this.build.run();
    } catch (e) {
      throw new Error(`Error while renaming the script sections:
${e.message}`);
    }

    return true;
  }

  private renumberInternal(
    newSection: { index: number; title?: string },
    increment: boolean,
    stopIndex?: number
  ): boolean {
    const filesToRename = this.existingSections.slice(
      newSection.index,
      stopIndex
    );

    try {
      for (let file of filesToRename) {
        const fileComponents = file.split("--");
        const newName = `${
          parseInt(fileComponents[0]) + (increment ? 1 : -1)
        }--${fileComponents[1]}`;

        renameSync(
          `${process.cwd()}/src/${file}`,
          `${process.cwd()}/src/${newName}`
        );
      }
    } catch (e) {
      throw new Error(`Error while renaming the script sections:
${e.message}`);
    }

    return true;
  }
}
