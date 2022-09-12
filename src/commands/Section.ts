import { readdirSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { orderBy } from "natural-orderby";
import prompts from "prompts";
import { Checks } from "../lib/Checks";

export class Section {
  private existingSections: string[] = [];
  private checks: Checks;
  constructor() {
    this.checks = new Checks();
  }

  init() {
    this.checks.srcFolderExists();

    this.existingSections = orderBy(readdirSync(`${process.cwd()}/src`));
  }

  // TODO: in the beginning and at the end to be tested
  async add(): Promise<boolean> {
    this.checks.srcFolderExists();

    const newSection: { index: number; title: string } = await prompts(
      [
        {
          type: "text",
          name: "title",
          message: "What will be the title?",
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
        onSubmit: (prompt, answer) => {
          // process.exit(0);
        },
      }
    );

    writeFileSync(
      `${process.cwd()}/src/${newSection.index + 1}--${newSection.title}.qvs`,
      `// ${newSection.title}`
    );
    this.renumberInternal(newSection, true);

    return true;
  }

  //TODO: ask for confirmation before delete the file
  async remove(): Promise<boolean> {
    this.checks.srcFolderExists();

    const section: { index: number; agree: boolean } = await prompts(
      [
        {
          type: "select",
          name: "index",
          initial: 0,
          optionsPerPage: 15,
          message: "Which section to remove?",
          choices: this.existingSections.map((s) => ({ title: s })),
        },
        {
          type: "toggle",
          name: "agree",
          message: "Are you sure you want to delete the section?",
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
        onSubmit: (prompt, answer) => {
          // process.exit(0);
        },
      }
    );

    if (section.agree == true) {
      unlinkSync(
        `${process.cwd()}/src/${this.existingSections[section.index]}`
      );

      this.renumberInternal({ index: section.index + 1 }, false);
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

    renameSync(
      `${process.cwd()}/src/${this.existingSections[moveSection.index1]}`,
      `${process.cwd()}/src/${newFileName}`
    );

    return true;
  }

  async renumber() {
    this.checks.srcFolderExists();

    for (let i = 0; i < this.existingSections.length; i++) {
      const fileComponents = this.existingSections[i].split("--");
      const newName = `${i + 1}--${fileComponents[1]}`;

      renameSync(
        `${process.cwd()}/src/${this.existingSections[i]}`,
        `${process.cwd()}/src/${newName}`
      );
      // console.log(this.existingSections[i], newName);
    }
  }

  private renumberInternal(
    newSection: { index: number; title?: string },
    increment: boolean,
    stopIndex?: number
  ) {
    const filesToRename = this.existingSections.slice(
      newSection.index,
      stopIndex
    );

    for (let file of filesToRename) {
      const fileComponents = file.split("--");
      const newName = `${parseInt(fileComponents[0]) + (increment ? 1 : -1)}--${
        fileComponents[1]
      }`;

      renameSync(
        `${process.cwd()}/src/${file}`,
        `${process.cwd()}/src/${newName}`
      );

      // console.log(file, newName);
    }
  }
}
