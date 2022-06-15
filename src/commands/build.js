import { short } from "../packages/initialChecks.js";
import { writeLog } from "../packages/common.js";
import { buildScriptArg } from "../packages/argumentsFunctions.js";

export async function build() {
  const checks = short();
  if (checks.error) writeLog("err", checks.message, true);

  const buildScriptResult = await buildScriptArg();
  if (buildScriptResult.error) writeLog("err", buildScriptResult.message, true);

  writeLog("ok", "Load script created and saved", true);
}
