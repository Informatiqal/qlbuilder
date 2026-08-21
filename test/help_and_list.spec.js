import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";
import { expect_subStringExistsInArray, test } from "./util";
import pkg from "../package.json" assert { type: "json" };

describe("Help and list commands", function () {
  it("Version", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js -v",
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(stdout, pkg.version, true);
  });

  it("Help", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js -h",
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(
        stdout,
        "Usage: qlbuilder command [environment name]",
        true,
      );
  });

  it("List templates", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js templates",
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(stdout, "SCRIPT");
  });

  it("List credentials", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js cred",
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(stdout, "local", false);
  });
});
