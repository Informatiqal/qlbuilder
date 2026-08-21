import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { expect_subStringExistsInArray, test } from "./util";

describe("Unknown command", function () {
  it("Unknown command", async function () {
    const { execute, ls, cleanup } = await prepareEnvironment();

    const { code, stdout, stderr } = await execute(
      "node",
      "./dist/index.js something temp",
    );

    await cleanup();

    expect(code).to.be.equal(1) &&
      expect_subStringExistsInArray(
        stderr,
        "Invalid command: something temp",
        true,
      );
  });
});
