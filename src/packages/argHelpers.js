import { Spinner } from "cli-spinner";
Spinner.setDefaultSpinnerDelay(200);

import fs from "fs";

import { buildLoadScript, writeLoadScript } from "./helpers.js";
import { reloadApp, checkScriptSyntax, setScript } from "./qlik-comm.js";
import { writeLog } from "./common.js";

export const buildScript = async function () {
  const loadScript = buildLoadScript();

  const writeScript = writeLoadScript(loadScript);
  if (writeScript.error) return writeScript;

  return { error: false, message: loadScript };
};

export const checkScript = async function ({
  environment,
  variables,
  script,
  args,
}) {
  const spinner = new Spinner("Checking for syntax errors ...");
  spinner.setSpinnerString("☱☲☴☲");
  spinner.start();

  let loadScript = "";

  if (script) {
    const script = await buildScript();
    if (script.error) return script;

    loadScript = script.message;
  }

  const scriptResult = await checkScriptSyntax({
    environment,
    variables,
    script: loadScript,
    debug: args && args.debug ? args.debug : false,
  });

  if (scriptResult.error) {
    spinner.stop(true);
    return scriptResult;
  }

  spinner.stop(true);

  if (scriptResult.message.length > 0) {
    displayScriptErrors(scriptResult.message);
    return { error: true, message: "Syntax errors found!" };
  }

  return { error: false, message: "No syntax errors were found" };
};

export const setScriptHelper = async function ({
  environment,
  variables,
  args,
}) {
  const script = await buildScript();
  if (script.error) return script;

  const setScriptResponse = await setScript({
    environment,
    variables,
    script: script.message,
    debug: args.debug,
  });
  if (setScriptResponse.error) return setScriptResponse;

  if (args.setAll) {
    if (environment.otherApps && environment.otherApps.length > 0) {
      await Promise.all(
        environment.otherApps.map(async function (a) {
          let tempEnvironment = environment;
          tempEnvironment.appId = a;

          writeLog({
            error: "info",
            message: `Setting script for ${a}`,
            exit: false,
          });

          const additionalSetScript = await setScript({
            environment: tempEnvironment,
            variables,
            script: script.message,
          });

          writeLog({
            error: "false",
            message: `Script set for ${a}`,
            exit: false,
          });

          return additionalSetScript;
        })
      ).then(function () {
        return { error: false, message: setScriptResponse.message };
      });
    }
  }

  return { error: false, message: setScriptResponse.message };
};

export function displayScriptErrors(scriptResultObj) {
  const scriptFiles = fs.readdirSync(`./src`).filter(function (f) {
    return f.indexOf(".qvs") > -1;
  });

  const scriptErrorsPrimary = scriptResultObj.filter(function (e) {
    return !e.qSecondaryFailure;
  });

  for (let scriptError of scriptErrorsPrimary) {
    const tabScript = fs
      .readFileSync(`./src/${scriptFiles[scriptError.qTabIx]}`)
      .toString()
      .split("\n");

    console.log(`
Tab : ${scriptFiles[scriptError.qTabIx]} 
Line: ${scriptError.qLineInTab} 
Code: ${tabScript[scriptError.qLineInTab - 1]}`);
  }
}

export const onFileChange = async function ({ environment, variables, args }) {
  const script = await buildScript();
  if (script.error) return script;

  const checkLoadScript = await checkScript({
    environment,
    variables,
    script: script.message,
    args,
  });
  if (checkLoadScript.error) return checkLoadScript;

  // if only SetScript is set
  if (!args.reload && args.setScript) {
    const setScriptResponse = await setScript({
      environment,
      variables,
      script: script.message,
      args,
    });
    if (setScriptResponse.error)
      return { error: true, message: setScriptResponse.message };

    return { error: false, message: setScriptResponse.message };
  }

  // if Reload is set AND/OR SetScript is set
  if (args.reload) {
    const reload = await reloadApp({
      environment,
      variables,
      script: script.message,
      args,
    });
    if (reload.error) return { error: true, message: reload.message };

    return { error: false, message: reload.message };
  }

  return checkLoadScript;
};
