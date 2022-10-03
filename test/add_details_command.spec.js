import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;

describe("App details command", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("App details command", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details ${process.env.QSE_ENV}`,
      "./temp"
    );

    await cleanup();

    expect(appDetailsResult.code).to.be.equal(0) &&
      expect(appDetailsResult.stderr.length).to.be.equal(0) &&
      expect(appDetailsResult.stdout.length).to.be.greaterThan(0) &&
      expect(
        appDetailsResult.stdout[0].indexOf(
          `${process.env.QSE_ENV_APP_ID_DETAILS}`
        )
      ).to.be.greaterThan(-1);
  });

  it("App details command with wrong app id", async function () {
    const { execute, cleanup, writeFile, readFile } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details ${process.env.QSE_ENV_WRONG_APP_ID}`,
      "./temp"
    );

    await cleanup();

    expect(appDetailsResult.code).to.be.equal(1) &&
      expect(appDetailsResult.stderr.length).to.be.equal(1) &&
      expect(appDetailsResult.stdout.length).to.be.equal(0) &&
      expect(
        appDetailsResult.stderr[0].indexOf("Socket closed")
      ).to.be.greaterThan(-1);
  });
});
