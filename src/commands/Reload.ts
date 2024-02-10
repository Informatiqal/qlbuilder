import path from "path";
import { writeFileSync, existsSync } from "fs";
import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { Spin } from "../lib/Spinner";
import { CustomError } from "../lib/CustomError";
import { Engine } from "../lib/Engine";
import { GetScriptOptionValues } from "../types/types";
import { CheckScript } from "./CheckScript";

export class Reload {
  private auth: Auth;
  private name: string;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private spin: Spin;
  constructor(name: string, options: GetScriptOptionValues) {
    this.name = name;
    this.options = options;

    this.spin = new Spin("Saving ...", "circle");

    const checks = new Checks();
    checks.all();

    const config = new Config(this.name);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    const auth = this.authMethod();
    await auth();

    const checkScript = new CheckScript(this.name, this.options);
    const errorsCount = await checkScript.run();

    if (errorsCount > 0) throw new Error("");

    const { global, doc, qlik } = await this.globalAndSetScript(
      checkScript.script
    );
    const reloadLogComplete = await this.reloadAndGetProgress(global, doc);

    if (this.options.reloadOutput || this.options.reloadOutputOverwrite)
      this.saveReloadLog(reloadLogComplete.message.reloadLog);

    if (reloadLogComplete.error == true) {
      try {
        qlik.session.close();
      } catch (e) {}

      throw new CustomError("Error during reload", "error", false);
    }

    this.spin.start();
    await doc.doSave();
    this.spin.stop();

    try {
      await qlik.session.close();
    } catch (e) {}

    return true;
  }

  private authMethod() {
    // QS desktop. Ignore any auth props (present or not)
    if (this.environment.host.indexOf(":4848") > -1) return this.auth.desktop;

    // for anything else raise an error
    if (!this.auth[this.environment.authentication.type])
      throw new CustomError(
        `Invalid authentication method - ${this.environment.authentication.type}`,
        "error",
        true
      );

    return () => this.auth[this.environment.authentication.type]();
  }

  private async globalAndSetScript(script: string) {
    const qlik = new Engine(
      this.environment.engineHost,
      this.environment.appId,
      this.auth.data.headers,
      this.environment.name,
      this.options.debug
    );

    const global = await qlik.session.open<EngineAPI.IGlobal>();
    const doc = await global.openDoc(this.environment.appId);
    await doc.setScript(script);

    try {
      await global.configureReload(true, true, false);
    } catch (e) {}

    return { global, doc, qlik };
  }

  private async reloadAndGetProgress(global, doc) {
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

  /**
   * Save the reload log once the app is reloaded
   */
  private async saveReloadLog(log: string[]) {
    const logPath = path.resolve(
      this.options.reloadOutput || this.options.reloadOutputOverwrite
    );
    const currentTime = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);

    let fileName = "";

    // if --reload-output is used then add the current timestamp to the filename
    if (this.options.reloadOutput)
      fileName = `${this.environment.appId}_${currentTime}.txt`;

    // if --reload-output-overwrite is used then use the appid only as filename
    if (this.options.reloadOutputOverwrite)
      fileName = `${this.environment.appId}.txt`;

    try {
      writeFileSync(`${logPath}\\${fileName}`, log.join("\n"));
    } catch (e) {
      throw new CustomError(
        `Error while saving the reload log:\n\n${e.message}`,
        "error",
        false
      );
    }
  }
}
