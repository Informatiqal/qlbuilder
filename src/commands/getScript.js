import { combined } from "../packages/initialChecks.js";
import { writeLog } from "../packages/common.js";
import {
  getScriptArg,
  buildScriptArg,
} from "../packages/argumentsFunctions.js";

export async function getScript(envName, options) {
  const checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  const getScriptResult = await getScriptArg({
    environment: checks.message.env,
    variables: checks.message.variables,
    args: {
      overwrite: options.y || false,
      debug: options.d || false,
    },
  });
  writeLog(getScriptResult.error ? "err" : "ok", getScriptResult.message, true);

  const buildScript = await buildScriptArg();
  writeLog(buildScript.error ? "err" : "ok", buildScript.message, true);
}
