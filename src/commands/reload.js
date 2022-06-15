import { combined } from "../packages/initialChecks.js";
import { writeLog } from "../packages/common.js";
import { reloadArg } from "../packages/argumentsFunctions.js";

export async function reload(envName, options) {
  const checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  const reloadResult = await reloadArg({
    environment: checks.message.env,
    variables: checks.message.variables,
    args: {
      debug: options.d || false,
    },
  });

  writeLog(reloadResult.error ? "err" : "ok", reloadResult.message, true);
}
