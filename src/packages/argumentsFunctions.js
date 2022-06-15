import fs, { link } from "fs";
import chokidar from "chokidar";
import filenamify from "filenamify";
import readline from "readline";

import { watch } from "./messages.js";
import {
  createInitFolders,
  createInitialScriptFiles,
  createInitConfig,
  createGitIgnoreFile,
  createVSCodeTasks,
  reCreateFolders,
  clearLocalScript,
} from "./helpers.js";
import { getScriptFromApp, checkScriptSyntax, reloadApp } from "./qlik-comm.js";
import { writeLog } from "./common.js";
import { parseLine } from "./readLine.js";
import {
  buildScript,
  checkScript,
  onFileChange,
  setScriptHelper,
  displayScriptErrors,
} from "./argHelpers.js";

export const createArg = async function (project, createTasks) {
  if (!fs.existsSync(`${process.cwd()}/${project}`)) {
    const folders = createInitFolders(project);
    if (folders.error) return folders;

    const initScript = createInitialScriptFiles(project);
    if (initScript.error) return initScript;

    const initConfig = createInitConfig(project);
    if (initConfig.error) return initConfig;

    const gitIgnore = createGitIgnoreFile(project);
    if (gitIgnore.error) return gitIgnore;

    if (createTasks) {
      const tasksFiles = createVSCodeTasks(project);
      if (tasksFiles.error) return tasksFiles;
    }

    return { error: false, message: "All set" };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let response = false;

  await new Promise((resolve, reject) =>
    rl.question(
      `Folder "${project}" already exists. Do you want to overwrite the SRC and DIST folders and config.yml (if they exists)? (y/n) `,
      (answer) => {
        if (answer.toLowerCase() == "y") {
          response = true;
        }
        rl.close();
        resolve();
      }
    )
  );

  if (response == true) {
    const reCreateSrc = reCreateFolders.src(project);
    if (reCreateSrc.error) return reCreateSrc;

    const reCreateDist = reCreateFolders.dist(project);
    if (reCreateDist.error) return reCreateDist;

    const writeScriptFiles = createInitialScriptFiles(project);
    if (writeScriptFiles.error) return writeScriptFiles;

    const writeConfig = createInitConfig(project);
    if (writeConfig.error) return writeConfig;

    const gitIgnore = createGitIgnoreFile(project);
    if (gitIgnore.error) return gitIgnore;

    return { error: false, message: "All re-created" };
  }

  return { error: false, message: "Nothing is performed" };
};

export const vscodeArg = function () {
  const tasksFiles = createVSCodeTasks();
  if (tasksFiles.error) return tasksFiles;

  return { error: false, message: "Folder and files were created" };
};

export const getScriptArg = async function ({ environment, variables, args }) {
  let overwrite = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve, reject) =>
    rl.question(
      `This will overwrite all local files. Are you sure? (y/n) `,
      (answer) => {
        if (answer.toLowerCase() == "y") {
          overwrite = true;
        }
        rl.close();
        resolve();
      }
    )
  );

  if (overwrite == true) {
    const getScriptFromAppResult = await getScriptFromApp({
      environment,
      variables,
      debug: args.debug,
    });
    if (getScriptFromAppResult.error) return getScriptFromAppResult;

    const scriptTabs = getScriptFromAppResult.message.split("///$tab ");

    const clearLocalScriptResult = clearLocalScript();
    if (clearLocalScriptResult.error) return clearLocalScriptResult;
    writeLog("ok", "Local script files removed", false);

    const writeScriptFiles = writeScriptToFiles(scriptTabs);
    if (writeScriptFiles.error) writeLog("ok", writeScriptFiles.message, false);

    return { error: false, message: writeScriptFiles.message };
  }

  return { error: false, message: "Nothing was changed" };
};

export const buildScriptArg = function () {
  return buildScript();
};

export const checkScriptArg = async function ({
  environment,
  variables,
  args,
}) {
  const script = await buildScript();
  if (script.error) return script;

  const result = await checkScript({
    environment,
    variables,
    script,
    args,
  });
  return result;
};

export const setScriptArg = async function ({ environment, variables, args }) {
  return await setScriptHelper({ environment, variables, args });
};

export const startWatchingArg = async function ({
  environment,
  variables,
  args,
}) {
  console.log(watch.commands());

  if (args.reload) console.log(watch.reload());

  if (args.disableChecks) console.log(watch.disableChecks());

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("qlBuilder> ");
  rl.prompt();

  rl.on("line", async function (line) {
    const result = await parseLine({ environment, variables, line: line });

    writeLog(result.error ? "err" : "ok", result.message, result.exit);

    rl.prompt();
  });

  const watcher = chokidar.watch("./src/*.qvs", {
    ignorePermissionErrors: true,
    awaitWriteFinish: true,
    ignoreInitial: true,
    depth: 0,
  });

  watcher.on("change", async function (fileName) {
    if (!args.disableChecks) {
      let result = await onFileChange({
        environment,
        variables,
        args,
      });

      writeLog(result.error ? "err" : "ok", result.message, result.exit);
      rl.prompt();
    }
  });
};

export const reloadArg = async function ({ environment, variables, args }) {
  const script = await buildScript();
  if (script.error) return script;

  const scriptResult = await checkScriptSyntax({
    environment,
    variables,
    script: script.message,
    debug: args.debug,
  });
  if (scriptResult.error) return scriptResult;

  if (scriptResult.message.length > 0) {
    displayScriptErrors(scriptResult.message);
    return { error: true, message: "Syntax errors found!" };
  }

  writeLog("ok", "No syntax errors", false);

  const reloadAppResponse = await reloadApp({
    environment,
    variables,
    script: script.message,
    debug: args.debug,
  });
  if (reloadAppResponse.error) return reloadAppResponse;

  return { error: false, message: reloadAppResponse.message };
};

function writeScriptToFiles(scriptTabs) {
  try {
    for (let [i, tab] of scriptTabs.entries()) {
      if (tab.length > 0) {
        const rows = tab.split("\r\n");
        const tabName = rows[0];
        const tabNameSafe = filenamify(tabName, { replacement: "" });

        const scriptContent = rows.slice(1, rows.length).join("\r\n");

        fs.writeFileSync(
          `${process.cwd()}/src/${i}--${tabNameSafe}.qvs`,
          scriptContent
        );
      }
    }
    return { error: false, message: "Local script files were created" };
  } catch (e) {
    return { error: true, message: e.message };
  }
}
