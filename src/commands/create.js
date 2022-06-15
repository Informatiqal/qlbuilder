import { writeLog } from "../packages/common.js";
import { createArg } from "../packages/argumentsFunctions.js";

export async function create(projectName, options) {
  if (!projectName)
    writeLog({
      error: true,
      message: `Please specify project name`,
      exit: true,
    });

  const init = await createArg(projectName, options.t ? true : false);
  writeLog(init.error ? "err" : "ok", init.message, true);
}
