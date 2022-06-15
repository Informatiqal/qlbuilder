import { writeLog } from "./common.js";
import { buildScript, checkScript, setScriptHelper } from "./argHelpers.js";
import { reloadApp, setScript } from "./qlik-comm.js";
import { watch } from "./messages.js";

export async function parseLine({ environment, variables, line }) {
  if (line == "?") return { error: false, message: watch.commands() };

  if (line.toLowerCase() === "x") {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    return { error: false, message: "Bye!", exit: true };
  }

  if (line.toLowerCase() === "c" || line.toLowerCase() === "cls") {
    process.stdout.write("\u001b[2J\u001b[0;0H");

    return { error: false, message: "Still here :)" };
  }

  if (line.toLowerCase() === "e" || line.toLowerCase() === "err") {
    let script = await buildScript();
    if (script.error) return script;

    let checkLoadScript = await checkScript({
      environment,
      variables,
      script: script.message,
    });
    return checkLoadScript;
  }

  if (line.toLowerCase() === "s" || line.toLowerCase() == "set") {
    let script = await buildScript();
    if (script.error) return script;

    writeLog("ok", "Script was build", false);

    let setScriptResponse = await setScript({
      environment,
      variables,
      script: script.message,
    });
    if (setScriptResponse.error) return setScriptResponse;

    return setScriptResponse;
  }

  if (line.toLowerCase() === "sa" || line.toLowerCase() == "setall") {
    let setAllScripts = await setScriptHelper({
      environment,
      variables,
      args: { setAll: true },
    });
    if (setAllScripts.error) return setScript;

    return setAllScripts;
  }

  if (line.toLowerCase() === "rl" || line.toLowerCase() === "r") {
    let script = await buildScript();
    if (script.error) return script;

    writeLog("ok", "Script was build", false);

    let checkLoadScript = await checkScript({
      environment,
      variables,
      script: script.message,
    });
    if (checkLoadScript.error) return checkLoadScript;

    writeLog("ok", checkLoadScript.message, false);

    let reload = await reloadApp({
      environment,
      variables,
      script: script.message,
    });
    if (reload.error) {
      return { error: true, message: reload.message };
    }

    return { error: false, message: reload.message };
  }

  return { error: true, message: `Unknown command "${line}"` };
}
