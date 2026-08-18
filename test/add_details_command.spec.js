import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";

describe("App details command", function () {
  it("App details command", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details local --output app_details.txt`,
      "./temp",
    );

    await cleanup();

    expect(appDetailsResult.code).to.be.equal(0) &&
      expect(appDetailsResult.stderr.length).to.be.equal(4) &&
      expect(appDetailsResult.stdout.length).to.be.greaterThan(0) &&
      expect(
        appDetailsResult.stdout[1].indexOf(constants.APP_DETAILS_ID),
      ).to.be.greaterThan(-1);
  });

  it("App details command with wrong app id", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details local-wrong-app-id`,
      "./temp",
    );

    await cleanup();

    const appMissingRequest = appDetailsResult.stderr.filter(
      (e) => e.indexOf("code 404") > -1,
    );

    expect(appDetailsResult.code).to.be.equal(1) &&
      expect(appMissingRequest.length).to.be.equal(1) &&
      expect(appDetailsResult.stdout.length).to.be.equal(0);
  });
});
