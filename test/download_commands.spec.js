import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";
import {
  copySessionToExecEnvironment,
  expect_subStringExistsInArray,
} from "./util";
import { copyFileSync, existsSync } from "fs";

describe("Download commands", function () {
  it("Download with data", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

    const { code, stderr, stdout } = await execute(
      "node",
      `./dist/index.js download local-empty -p ${path}\\temp`,
      "./temp",
    );

    await cleanup();

    const qvfPresent = existsSync(
      `${path}\\temp\\${constants.SCRIPT_TESTS_APP_NAME}`,
    );

    expect(code).to.be.equal(0) &&
      expect(qvfPresent).to.be.equal(true) &&
      expect_subStringExistsInArray(stdout, "Download was complete", true);
  });

  it("Download w/o data", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

    const { code, stderr, stdout } = await execute(
      "node",
      `./dist/index.js download --nd false -p ${path}\\temp local-empty`,
      "./temp",
    );

    const qvfPresent = existsSync(
      `${path}\\temp\\${constants.SCRIPT_TESTS_APP_NAME}`,
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(qvfPresent).to.be.equal(true) &&
      expect_subStringExistsInArray(stdout, "Download was complete", true);
  });
});
