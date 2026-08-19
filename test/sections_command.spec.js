import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";
import { expect_subStringExistsInArray } from "./util";
import { existsSync } from "fs";

describe("Sections command", function () {
  it("Add section", async function () {
    const { execute, cleanup, writeFile, readFile, path, spawn } =
      await prepareEnvironment();

    const createResult = await execute("node", "./dist/index.js create temp");

    const {
      wait,
      waitForText,
      waitForFinish,
      writeText,
      getStdout,
      getStderr,
      getExitCode,
      pressKey,
      kill,
    } = await spawn("node", "./dist/index.js section add", "./temp");

    await waitForText("What will be the title of the new section?");
    await writeText("TEST");
    await pressKey("enter");
    await waitForText("AFTER which section to insert the new section?");
    await pressKey("arrowDown");
    await pressKey("enter");
    await waitForFinish();

    const stdout = getStdout();
    const stderr = getStderr();
    const code = getExitCode();

    kill();

    const newSectionExists = existsSync(`${path}\\temp\\src\\2--TEST.qvs`);

    await cleanup();

    expect(code).to.be.equal(0) && expect(newSectionExists).to.be.equal(true);
  });

  it("Remove section", async function () {
    const { execute, cleanup, writeFile, readFile, path, spawn } =
      await prepareEnvironment();

    const createResult = await execute("node", "./dist/index.js create temp");

    const addSectionSpawn = await spawn(
      "node",
      "./dist/index.js section add",
      "./temp",
    );

    await addSectionSpawn.waitForText(
      "What will be the title of the new section?",
    );
    await addSectionSpawn.writeText("TEST");
    await addSectionSpawn.pressKey("enter");
    await addSectionSpawn.waitForText(
      "AFTER which section to insert the new section?",
    );
    await addSectionSpawn.pressKey("arrowDown");
    await addSectionSpawn.pressKey("enter");
    await addSectionSpawn.waitForFinish();

    const newSectionExists = existsSync(`${path}\\temp\\src\\2--TEST.qvs`);

    const addSectionStdout = addSectionSpawn.getStdout();
    const addSectionStderr = addSectionSpawn.getStderr();
    const addSectionCode = addSectionSpawn.getExitCode();

    addSectionSpawn.kill();

    const removeSectionSpawn = await spawn(
      "node",
      "./dist/index.js section remove",
      "./temp",
    );

    await removeSectionSpawn.waitForText("Which section to remove?");
    await removeSectionSpawn.pressKey("arrowDown");
    await removeSectionSpawn.pressKey("arrowDown");
    await removeSectionSpawn.pressKey("arrowDown");
    await removeSectionSpawn.pressKey("space");
    await removeSectionSpawn.pressKey("enter");
    await removeSectionSpawn.waitForText(
      "Are you sure you want to delete the section(s)?",
    );
    await removeSectionSpawn.pressKey("arrowRight");
    await removeSectionSpawn.pressKey("enter");
    await removeSectionSpawn.waitForFinish();

    const newSectionRemoved = existsSync(`${path}\\temp\\src\\2--TEST.qvs`);

    const removeSectionStdout = removeSectionSpawn.getStdout();
    const removeSectionStderr = removeSectionSpawn.getStderr();
    const removeSectionCode = removeSectionSpawn.getExitCode();

    removeSectionSpawn.kill();

    await cleanup();

    expect(addSectionCode).to.be.equal(0) &&
      expect(removeSectionCode).to.be.equal(0) &&
      expect(newSectionExists).to.be.equal(true) &&
      expect(!newSectionRemoved).to.be.equal(true);
  });

  it("Move section", async function () {
    const { execute, cleanup, writeFile, readFile, path, spawn } =
      await prepareEnvironment();

    const createResult = await execute("node", "./dist/index.js create temp");

    const addSectionSpawn = await spawn(
      "node",
      "./dist/index.js section add",
      "./temp",
    );

    await addSectionSpawn.waitForText(
      "What will be the title of the new section?",
    );
    await addSectionSpawn.writeText("TEST");
    await addSectionSpawn.pressKey("enter");
    await addSectionSpawn.waitForText(
      "AFTER which section to insert the new section?",
    );
    await addSectionSpawn.pressKey("arrowDown");
    await addSectionSpawn.pressKey("enter");
    await addSectionSpawn.waitForFinish();

    const newSectionExists = existsSync(`${path}\\temp\\src\\2--TEST.qvs`);

    const addSectionStdout = addSectionSpawn.getStdout();
    const addSectionStderr = addSectionSpawn.getStderr();
    const addSectionCode = addSectionSpawn.getExitCode();

    addSectionSpawn.kill();

    const moveSectionSpawn = await spawn(
      "node",
      "./dist/index.js section move",
      "./temp",
    );

    await moveSectionSpawn.waitForText("Which section should be moved?");
    await moveSectionSpawn.pressKey("enter");
    await moveSectionSpawn.waitForText("AFTER which section to be moved?");
    await moveSectionSpawn.pressKey("arrowDown");
    await moveSectionSpawn.pressKey("arrowDown");
    await moveSectionSpawn.pressKey("enter");
    await moveSectionSpawn.waitForFinish();

    const newSectionMoved = existsSync(`${path}\\temp\\src\\1--TEST.qvs`);
    const oldSectionRenumbered = existsSync(`${path}\\temp\\src\\2--Main.qvs`);

    const moveSectionStdout = moveSectionSpawn.getStdout();
    const moveSectionStderr = moveSectionSpawn.getStderr();
    const moveSectionCode = moveSectionSpawn.getExitCode();

    moveSectionSpawn.kill();

    await cleanup();

    expect(addSectionCode).to.be.equal(0) &&
      expect(moveSectionCode).to.be.equal(0) &&
      expect(newSectionExists).to.be.equal(true) &&
      expect(newSectionMoved).to.be.equal(true) &&
      expect(oldSectionRenumbered).to.be.equal(true);
  });
});
