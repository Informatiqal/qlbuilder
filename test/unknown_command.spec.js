import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;

describe("Unknown command", function () {
  this.timeout(30000);
  this.beforeEach(function (done) {
    setTimeout(function () {
      console.log("waiting");
      done();
    }, 1000);
  });

  it("Unknown command", async function () {
    const { execute, ls, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js something temp"
    );

    await cleanup();

    expect(code).to.be.equal(1) &&
      expect(stdout.length).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(2) &&
      expect(stderr[0]).to.be.equal("Invalid command: something temp");
  });
});
