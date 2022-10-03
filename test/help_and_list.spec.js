import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import pkg from "../package.json" assert { type: "json" };

const expect = chai.expect;

describe("Help and list commands", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("Version", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js -v"
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(0) &&
      expect(stdout[0]).to.be.equal(pkg.version);
  });

  it("Help", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js -h"
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(0) &&
      expect(stdout.length).to.be.greaterThan(0) &&
      expect(
        stdout[0].indexOf("Usage: qlbuilder command [environment name]")
      ).to.be.greaterThan(-1);
  });

  it("List templates", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js templates"
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(0) &&
      expect(stdout.length).to.be.greaterThan(0) &&
      expect(stdout[3].indexOf("SCRIPT")).to.be.greaterThan(-1);
  });

  it("List credentials", async function () {
    const { execute, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js cred"
    );

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(0) &&
      expect(stdout.length).to.be.greaterThan(0) &&
      expect(stdout[4].indexOf("local")).to.be.greaterThan(-1);
  });
});
