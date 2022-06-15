import { setScriptArg } from "../packages/argumentsFunctions.js";
import { writeLog } from "../packages/common.js";
import { combined } from "../packages/initialChecks.js";

export async function setScript(envName, options) {
  const checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  const setScriptResult = await setScriptArg({
    environment: checks.message.env,
    variables: checks.message.variables,
    args: {
      setAll: options.a || false,
      debug: options.d || false,
    },
  });
  writeLog(setScriptResult.error ? "err" : "ok", setScriptResult.message, true);
}
