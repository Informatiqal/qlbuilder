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

    expect(downloadResult.code).to.be.equal(0) &&
      expect(downloadResult.stderr.length).to.be.equal(0) &&
      expect(downloadResult.stdout.length).to.be.equal(1) &&
      expect(
        downloadResult.stdout[0].indexOf("was saved in")
      ).to.be.greaterThan(-1) &&
      expect(downloadsFolderContent.length).to.be.equal(1) &&
      expect(downloadsFolderContent[0].indexOf(".qvf")).to.be.greaterThan(-1);
  });

  it("Download command wrong app id", async function () {
    const { execute, cleanup, makeDir, ls, path, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    await makeDir("./downloads");

    const downloadResult = await execute(
      "node",
      `./dist/index.js download ${process.env.QSE_ENV_WRONG_APP_ID} -p ${path}/downloads`,
      "./temp"
    );

    const downloadsFolderContent = await ls("./downloads");

    await cleanup();

    expect(downloadResult.code).to.be.equal(1) &&
      expect(downloadResult.stderr.length).to.be.equal(1) &&
      expect(downloadResult.stdout.length).to.be.equal(0) &&
      expect(
        downloadResult.stderr[0].indexOf("Request failed with status code 404")
      ).to.be.greaterThan(-1) &&
      expect(downloadsFolderContent.length).to.be.equal(0);
  });
});
