import dotenv from "dotenv";
dotenv.config();

import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;
describe("Get script command", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("Get script command", async function () {
    const { execute, cleanup, makeDir, ls, path, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    const getScriptResult = await execute(
      "node",
      `./dist/index.js getScript ${process.env.QSE_ENV} -y`,
      "./temp"
    );

    const srcFolderContent = await ls("./temp/src");
    const builtScriptContent = await (
      await readFile("./temp/dist/LoadScript.qvs")
    ).split("///$tab");

    await cleanup();

    expect(getScriptResult.code).to.be.equal(0) &&
      expect(getScriptResult.stderr.length).to.be.equal(0) &&
      expect(getScriptResult.stdout.length).to.be.greaterThan(0) &&
      expect(srcFolderContent.length).to.be.greaterThan(1) &&
      expect(builtScriptContent.length).to.be.greaterThan(2);
  });

  it("Get script command wrong app id", async function () {
    const { execute, cleanup, makeDir, ls, path, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    const getScriptResult = await execute(
      "node",
      `./dist/index.js getScript ${process.env.QSE_ENV_WRONG_APP_ID} -y`,
      "./temp"
    );

    const srcFolderContent = await ls("./temp/src");
    const builtScriptContent = await (
      await readFile("./temp/dist/LoadScript.qvs")
    ).split("///$tab");

    await cleanup();

    expect(getScriptResult.code).to.be.equal(1) &&
      expect(getScriptResult.stdout.length).to.be.equal(0) &&
      expect(getScriptResult.stderr.length).to.be.greaterThan(0) &&
      expect(
        getScriptResult.stderr[0].indexOf("Socket closed")
      ).to.be.greaterThan(-1) &&
      expect(srcFolderContent.length).to.be.equal(1) &&
      expect(builtScriptContent.length).to.be.equal(2);
  });
});
