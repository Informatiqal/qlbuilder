import { CustomError } from "../../lib/CustomError.js";
import {
  PluginArguments,
  PluginArgumentsEngine,
  PluginMeta,
} from "../../types/types.js";
import { action as c } from "./CheckScript.js";

const meta: PluginMeta = {
  command: {
    name: "reload",
    description: "Set script and reload the target app",
    aliases: ["Reload"],
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
      {
        flag: "--ro, --reload-output <LOCATION>",
        description: "Path. Save the reload log into the provided folder",
      },
      {
        flag: "--roo, --reload-output-overwrite <LOCATION>",
        description:
          "Path. Save the reload log into the provided folder by overwriting the existing log",
      },
    ],
  },
  options: {
    requireConnection: true,
    requireEnv: true,
    requireApp: true,
  },
};

async function action(args: PluginArguments) {
//   const build = new args.tools.build();
//   const print = new args.tools.print();
  const spin = new args.tools.spinner("Saving ...", "circle");

  const checkScriptResponse = await checkScript(args);
  if (checkScriptResponse.errorsCount > 0) process.exit(1);

  if (args.engine.app)
    //@ts-ignore
    await args.engine.app.setScript(checkScriptResponse.script);

  try {
    await (args.engine as PluginArgumentsEngine).global.configureReload(
      true,
      true,
      false,
    );
  } catch (e) {}

  const reloadLogComplete = await reloadAndGetProgress(
    args.engine.global,
    args.engine.app,
  );

  //   if (this.options.reloadOutput || this.options.reloadOutputOverwrite)
  //     this.saveReloadLog(reloadLogComplete.message.reloadLog);

  if (reloadLogComplete.error == true) {
    try {
      (args.engine as PluginArgumentsEngine).session.close();
    } catch (e) {}

    throw new CustomError("Error during reload", "error", false);
  }

  spin.start();
  await (args.engine as PluginArgumentsEngine).app.doSave();
  spin.stop();
}

async function checkScript(args: PluginArguments) {
  const a = new args.engine.enigmaInstance(
    args.environment?.engineHost,
    args.environment?.appId,
    args.engine.auth?.data.headers,
    "",
    true,
  );

  const s = a.session;
  const g = await a.session.open();
  const b = { ...args };
  b.engine = {
    app: undefined,
    auth: args.engine.auth,
    enigmaInstance: args.engine.enigmaInstance,
    global: g,
    session: s,
  };

  const c1 = await c(b);

  return c1;
}

async function reloadAndGetProgress(global, doc) {
  let scriptError = false;
  let scriptResult = [];
  let reloadLog: string[] = [];

  const reloadProgress = global.mGetReloadProgress();

  reloadProgress.emitter.on("progress", (msg) => {
    reloadLog.push(msg);
    console.log(msg);
  });

  reloadProgress.emitter.on("error", (msg) => {
    scriptError = true;
  });

  const reloadApp: {
    error: boolean;
    message: {
      success: boolean;
      reloadLog: string[];
      log: string;
      script: string[];
      scriptError: boolean;
    };
  } = await new Promise(function (resolve, reject) {
    console.log("");
    console.log("--------------- RELOAD STARTED ---------------");
    console.log("");

    doc.doReloadEx().then((result) => {
      setTimeout(function () {
        reloadProgress.stop();

        console.log("");
        console.log("--------------- RELOAD COMPLETED ---------------");
        console.log("");

        resolve({
          error: scriptError,
          message: {
            success: false,
            log: result.qScriptLogFile,
            script: scriptResult,
            scriptError: scriptError,
            reloadLog,
          },
        });
      }, 300);
    });

    reloadProgress.start({
      skipTransientMessages: false,
      trimLeadingMessage: false,
      includeTimeStamp: true,
    });
  });

  return reloadApp;
}

export { meta, action };
