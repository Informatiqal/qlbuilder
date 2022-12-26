import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import fetch from "node-fetch";
import { copySessionID } from "./util.js";

const expect = chai.expect;

describe("Create app command", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("Create app command", async function () {
    const { execute, cleanup, path } = await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate"
    );

    const sessionId = copySessionID(path, "temp");

    const createAppResult = await execute(
      "node",
      `./dist/index.js createApp ${process.env.CREATE_APP_NAME} ${process.env.QSE_ENV} -d`,
      "./temp"
    );

    const appId = createAppResult.stdout[0].split(`"`)[3];

    const appDetailsResult = await execute(
      "node",
      `./dist/index.js details ${process.env.QSE_ENV} -d`,
      "./temp"
    );

    const deleteAppStatus = await fetch(
      `https://${process.env.QSE_ENV_HOST}/${process.env.QSE_ENV_PROXY}/qrs/app/${appId}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `${process.env.QSE_ENV_SESSION_HEADER}=${sessionId}`,
          Authorization: `Bearer ${process.env.QSE_ENV_TOKEN}`,
        },
      }
    ).then((res) => res.status);

    await cleanup();

    expect(createAppResult.code).to.be.equal(0) &&
      expect(createAppResult.stderr.length).to.be.equal(0) &&
      expect(
        createAppResult.stdout[0].indexOf("was created with ID")
      ).to.be.greaterThan(-1) &&
      expect(appDetailsResult.code).to.be.equal(0) &&
      expect(appDetailsResult.stderr.length).to.be.equal(0) &&
      expect(appDetailsResult.stdout.length).to.be.greaterThan(0) &&
      expect(
        appDetailsResult.stdout[0].indexOf(
          `${process.env.QSE_ENV_APP_ID_DETAILS}`
        )
      ).to.be.greaterThan(-1);
  });
});
