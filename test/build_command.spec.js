import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";

describe("Build command", function () {
  it("Build command", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp",
    );

    const newSection = await writeFile(
      "./temp/src/1--TestScript.qvs",
      "//This is a test script\nset a = 123;",
    );

    const builtScriptResult = await execute(
      "node",
      "./dist/index.js build",
      "./temp",
    );

    const builtScript = await readFile("./temp/dist/LoadScript.qvs");

    await cleanup();

    expect(builtScriptResult.code).to.be.equal(0) &&
      expect(
        builtScriptResult.stderr.length == 2 ||
          builtScriptResult.stderr.length == 0,
      ).to.be.true &&
      expect(builtScriptResult.stdout.length).to.be.equal(1) &&
      expect(builtScript.indexOf("set a = 123")).to.be.greaterThan(-1) &&
      expect(
        builtScriptResult.stdout[0].indexOf(
          "Load script created and saved (locally)",
        ),
      ).to.be.greaterThan(-1);
  });

  it("Build command from a wrong folder", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp",
    );

    const builtScriptResult = await execute("node", "./dist/index.js build");

    await cleanup();

    const srcMissingMessage = builtScriptResult.stderr.filter(
      (e) => e.indexOf(`"src" folder was not found`) > -1,
    );

    expect(builtScriptResult.code).to.be.equal(1) &&
      expect(
        builtScriptResult.stderr.length == 3 ||
          builtScriptResult.stderr.length == 1,
      ).to.be.true &&
      expect(builtScriptResult.stdout.length).to.be.equal(0) &&
      expect(srcMissingMessage.length).to.be.equal(1);
  });
});
