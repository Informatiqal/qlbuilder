import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;
describe("Build command", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("Build command", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp"
    );

    const newSection = await writeFile(
      "./temp/src/1--TestScript.qvs",
      "//This is a test script\nset a = 123;"
    );

    const builtScriptResult = await execute(
      "node",
      "./dist/index.js build",
      "./temp"
    );

    const builtScript = await readFile("./temp/dist/LoadScript.qvs");

    await cleanup();

    expect(builtScriptResult.code).to.be.equal(0) &&
      expect(builtScriptResult.stderr.length).to.be.equal(0) &&
      expect(builtScriptResult.stdout.length).to.be.equal(1) &&
      expect(builtScript.indexOf("set a = 123")).to.be.greaterThan(-1) &&
      expect(
        builtScriptResult.stdout[0].indexOf(
          "Load script created and saved (locally)"
        )
      ).to.be.greaterThan(-1);
  });

  it("Build command from a wrong folder", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp"
    );

    const builtScriptResult = await execute("node", "./dist/index.js build");

    await cleanup();

    expect(builtScriptResult.code).to.be.equal(1) &&
      expect(builtScriptResult.stderr.length).to.be.equal(1) &&
      expect(builtScriptResult.stdout.length).to.be.equal(0) &&
      expect(
        builtScriptResult.stderr[0].indexOf('"src" folder was not found')
      ).to.be.greaterThan(-1);
  });
});
