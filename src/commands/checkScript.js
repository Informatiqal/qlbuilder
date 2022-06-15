import { combined } from "../packages/initialChecks.js";
import { writeLog } from "../packages/common.js";
import { checkScriptArg } from "../packages/argumentsFunctions.js";

export async function checkScript(envName, options) {
  const checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  const checkScriptResult = await checkScriptArg({
    environment: checks.message.env,
    variables: checks.message.variables,
    args: {
      debug: options.d || false,
    },
  });
  writeLog(
    checkScriptResult.error ? "err" : "ok",
    checkScriptResult.message,
    true
  );
}
