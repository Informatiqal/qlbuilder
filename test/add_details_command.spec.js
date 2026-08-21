import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";
import {
  copySessionToExecEnvironment,
  expect_subStringExistsInArray,
} from "./util";

describe("App details command", function () {
  it("App details command", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details local --output app_details.txt`,
      "./temp",
    );

    await cleanup();

    expect(appDetailsResult.code).to.be.equal(0) &&
      expect_subStringExistsInArray(
        appDetailsResult.stdout,
        constants.APP_DETAILS_ID,
        true,
      );
  });

  it("App details command with wrong app id", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details local-wrong-app-id`,
      "./temp",
    );

    await cleanup();

    const appMissingRequest = appDetailsResult.stderr.filter(
      (e) => e.indexOf("code 404") > -1,
    );

    expect(appDetailsResult.code).to.be.equal(1);
  });
});
