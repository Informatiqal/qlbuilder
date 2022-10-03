import dotenv from "dotenv";
dotenv.config();

import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;
describe("Download command", function () {
  this.timeout(30000);

  it("Download command", async function () {
    const { execute, cleanup, makeDir, ls, path, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    await makeDir("./downloads");

    const downloadResult = await execute(
      "node",
      `./dist/index.js download ${process.env.QSE_ENV} -p ${path}/downloads`,
      "./temp"
    );

    const downloadsFolderContent = await ls("./downloads");

    await cleanup();

    expect(builtScriptResult.code).to.be.equal(0) &&
      expect(builtScriptResult.stderr.length).to.be.equal(0) &&
      expect(builtScriptResult.stdout.length).to.be.equal(1) &&
      expect(builtScript.indexOf("set a = 123")).to.be.greaterThan(-1);
  });

  it("Download command wrong app id", async function () {
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
        builtScriptResult.stderr[0].indexOf('✖ "src" folder was not found')
      ).to.be.greaterThan(-1);
  });
});
