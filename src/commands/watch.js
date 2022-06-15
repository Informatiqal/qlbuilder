import { combined } from "../packages/initialChecks.js";
import { writeLog } from "../packages/common.js";
import { startWatchingArg } from "../packages/argumentsFunctions.js";

export async function watch(envName, options) {
  let checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  await startWatchingArg({
    environment: checks.message.env,
    variables: checks.message.variables,
    args: {
      reload: options.r || false,
      setScript: options.s || false,
      disableChecks: options.d || false,
      debug: options.d || false,
    },
  });
}
