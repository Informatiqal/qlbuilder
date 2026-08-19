import { describe, it, expect } from "vitest";
import { prepareEnvironment } from "@gmrchk/cli-testing-library";
import { constants } from "./_testing_constants";
import {
  copySessionToExecEnvironment,
  expect_subStringExistsInArray,
  sleep,
} from "./util";
import {
  copyFileSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";

describe("Script related commands", function () {
  it("Get script (auto confirm)", async function () {
    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

    const { code, stderr, stdout } = await execute(
      "node",
      `./dist/index.js getScript local -y`,
      "./temp",
    );

    await cleanup();

    expect(code).to.be.equal(0);
  });

  it("Get script (manual confirm)", async function () {
    const { execute, cleanup, writeFile, readFile, path, spawn } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate",
    );

    copySessionToExecEnvironment(path);

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
    } = await spawn("node", `./dist/index.js getScript local`, "./temp");

    await waitForText(
      "This will overwrite all local files. Are you sure? (y/n) ",
    );
    await writeText("y");
    await wait(2000);
    await pressKey("enter");
    await waitForFinish();

    const stdout = getStdout();
    const stderr = getStderr();
    const code = getExitCode();

    kill();

    await cleanup();

    expect(code).to.be.equal(0) &&
      expect_subStringExistsInArray(
        stdout,
        "Load script created and saved (locally)",
        true,
      );
  });

  it("Set/Get/Check script", async function () {
    const newTabName = "TESTING LIBRARY";
    const newScript = `Load 'running test' as SomeField Autogenerate(1);`;
    const rollbackScript = `Load 'PLACEHOLDER value' as TempField Autogenerate(1); 123`;

    const { execute, cleanup, writeFile, readFile, path } =
      await prepareEnvironment();

    const createResult = await execute(
      "node",
      "./dist/index.js create temp -c configTemplate -s empty",
    );

    copySessionToExecEnvironment(path);
    await sleep(1000);

    renameSync(
      `${path}\\temp\\src\\1--Main.qvs`,
      `${path}\\temp\\src\\1--${newTabName}.qvs`,
    );

    await sleep(1000);

    writeFileSync(`${path}\\temp\\src\\1--${newTabName}.qvs`, newScript);

    await sleep(1000);

    const setScriptResult = await execute(
      "node",
      `./dist/index.js setScript local-empty`,
      `.\\temp`,
    );

    const checkScriptResult1 = await execute(
      "node",
      `./dist/index.js checkScript local-empty`,
      `.\\temp`,
    );

    unlinkSync(`${path}\\temp\\src\\1--${newTabName}.qvs`);

    const getScriptResult = await execute(
      "node",
      `./dist/index.js getScript local-empty -y`,
      `.\\temp`,
    );

    const postGetScriptFileContent = readFileSync(
      `${path}\\temp\\src\\1--${newTabName}.qvs`,
    )
      .toString()
      .split("\n");

    // set the default script to the app for the next test run
    renameSync(
      `${path}\\temp\\src\\1--${newTabName}.qvs`,
      `${path}\\temp\\src\\1--Main.qvs`,
    );
    writeFileSync(`${path}\\temp\\src\\1--Main.qvs`, rollbackScript);
    await execute("node", `./dist/index.js setScript local-empty`, `.\\temp`);

    const checkScriptResult2 = await execute(
      "node",
      `./dist/index.js checkScript local-empty`,
      `.\\temp`,
    );

    await cleanup();

    expect(setScriptResult.code).to.be.equal(0) &&
      expect(getScriptResult.code).to.be.equal(0) &&
      expect_subStringExistsInArray(
        postGetScriptFileContent,
        newScript,
        true,
      ) &&
      expect_subStringExistsInArray(
        setScriptResult.stdout,
        "Load script was set",
        true,
      ) &&
      expect_subStringExistsInArray(
        getScriptResult.stdout,
        "Local script files were created",
        true,
      ) &&
      expect_subStringExistsInArray(
        checkScriptResult1.stdout,
        "No syntax errors were found",
        true,
      ) &&
      expect_subStringExistsInArray(
        checkScriptResult2.stdout,
        "1 Syntax error(s) were found",
        true,
      );
  });
});
