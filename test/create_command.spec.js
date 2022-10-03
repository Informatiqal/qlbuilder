import chai from "chai";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";

const expect = chai.expect;

describe("Create command", function () {
  this.timeout(30000);

  it("Version", async function () {
    const { execute, ls, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js create temp"
    );

    const structure = await ls("./temp");

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect(stderr.length).to.be.equal(0) &&
      expect(stdout.length).to.be.equal(1) &&
      expect(stdout[0].indexOf("All set")).to.be.greaterThan(-1) &&
      expect(structure.length).to.be.equal(5);
  });
});
