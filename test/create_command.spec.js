import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";

describe("Create command", function () {
  it("Create an empty project", async function () {
    const { execute, ls, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp",
    );

    const structure = await ls("./temp");

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length == 2 || stderr.length == 0).to.be.true &&
      expect(stdout.length).to.be.greaterThan(0) &&
      expect(
        stdout.filter((s) => s.indexOf("All set") > -1).length,
      ).to.be.equal(1) &&
      expect(structure.length).to.be.equal(5);
  });

  it("Create command with empty name (test the error thrown)", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create",
    );

    await cleanup();

    expect(code).to.be.equal(1) &&
      expect(
        stderr.filter((s) =>
          s.indexOf("error: missing required argument 'name'"),
        ).length > -1,
      ).to.be.equal(true);
  });

  it("With vscode argument)", async function () {
    const { execute, ls, cleanup } = await prepareEnvironment();

    const { code, stderr } = await execute(
      "node",
      "./dist/index.js create temp -t",
    );

    const structure = await (await ls("./temp")).filter((f) => f == ".vscode");

    await cleanup();

    expect(code).to.be.equal(0) && expect(structure.length).to.be.equal(1);
  });

  it("With script template)", async function () {
    const { execute, ls, cleanup, readFile } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp -s TestTemplate",
    );

    const structure = await await ls("./temp/src");
    const builtScript = await (
      await readFile("./temp/dist/LoadScript.qvs")
    ).split("///$tab");

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(structure.length).to.be.equal(3) &&
      expect(builtScript.length).to.be.equal(4) &&
      expect(
        stdout.filter((s) => s.indexOf("All set") > -1).length == 1,
      ).to.equals(true);
  });

  it("With script template - missing template)", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp -s TestTemplate_missing",
    );

    await cleanup();

    expect(code).to.be.equal(1) &&
      expect(
        stderr.filter((s) => s.indexOf("not found") > -1).length == 1,
      ).to.equals(true);
  });

  it("With config template)", async function () {
    const { execute, cleanup, readFile } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp -c TestConfigTemplate",
    );

    const configContent = await readFile("./temp/config.yml");

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(configContent.indexOf("TEST_USER")).to.be.greaterThan(-1) &&
      expect(
        stdout.filter((s) => s.indexOf("All set") > -1).length == 1,
      ).to.equals(true);
  });

  it("With config template - missing template)", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp -c TestConfigTemplate_missing",
    );

    await cleanup();

    expect(code).to.be.equal(1) &&
      expect(
        stderr.filter((s) => s.indexOf("not found") > -1).length == 1,
      ).to.equals(true);
  });

  it("With all optional arguments)", async function () {
    const { execute, ls, cleanup, readFile } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp -t -c TestConfigTemplate -s TestTemplate",
    );

    const structure = await await ls("./temp/src");
    const builtScript = await (
      await readFile("./temp/dist/LoadScript.qvs")
    ).split("///$tab");

    const vsCodeFolder = await (
      await ls("./temp")
    ).filter((f) => f == ".vscode");

    const configContent = await readFile("./temp/config.yml");

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(vsCodeFolder.length).to.be.equal(1) &&
      expect(structure.length).to.be.equal(3) &&
      expect(builtScript.length).to.be.equal(4) &&
      expect(configContent.indexOf("TEST_USER")).to.be.greaterThan(-1) &&
      expect(
        stdout.filter((s) => s.indexOf("All set") > -1).length == 1,
      ).to.equals(true);
  });
});
