import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { expect_subStringExistsInArray, sleep } from "./util";
import { readFileSync } from "node:fs";

describe("Tables and fields", function () {
  it("Tables and fields", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    const { code, stdout, stderr } = await execute(
      "node",
      `./dist/index.js tables local`,
      "./temp",
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(stdout, "Distinct values", false);
  });

  // it("Tables and fields (text output)", async function () {
  //   const { execute, cleanup, writeFile, readFile, path } =
  //     await prepareEnvironment();

  //   const createResult = await execute(
  //     "node",
  //     "./dist/index.js create temp -c configTemplate",
  //   );

  //   const outputFile = `${path}\\temp\\tables_and_fields.txt`;

  //   const { code, stdout, stderr } = await execute(
  //     "node",
  //     `./dist/index.js tables local --output ${outputFile}`,
  //     "./temp",
  //   );

  //   await sleep(2000);

  //   const outputFileContent = readFileSync(outputFile).toString().split("\n");

  //   await cleanup();

  //   expect(code).to.be.equal(0) &&
  //     expect_subStringExistsInArray(
  //       outputFileContent,
  //       "Distinct values",
  //       false,
  //     );
  // });

  // it("Tables and fields (markdown output)", async function () {
  //   const { execute, cleanup, writeFile, readFile, path } =
  //     await prepareEnvironment();

  //   const createResult = await execute(
  //     "node",
  //     "./dist/index.js create temp -c configTemplate",
  //   );

  //   const outputFile = `${path}\\temp\\tables_and_fields.md`;

  //   const { code, stdout, stderr } = await execute(
  //     "node",
  //     `./dist/index.js tables local --output ${outputFile}`,
  //     "./temp",
  //   );

  //   await sleep(2000);

  //   const outputFileContent = readFileSync(outputFile).toString().split("\n");

  //   await cleanup();

  //   expect(code).to.be.equal(0) &&
  //     expect_subStringExistsInArray(
  //       outputFileContent,
  //       "TABLES AND FIELDS",
  //       true,
  //     );
  // });
});
