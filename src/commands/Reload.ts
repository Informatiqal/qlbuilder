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

    return { global, doc, qlik };
  }

  private async reloadAndGetProgress(global, doc) {
    return new Promise<{
      error: boolean;
      message: {
        success: boolean;
        reloadLog: string[];
        log: string;
        script: string[];
        scriptError: boolean;
      };
    }>(function (resolve, reject) {
      console.log("");
      console.log("--------------- RELOAD STARTED ---------------");
      console.log("");

      let reloaded = false;
      let scriptError = false;
      let scriptResult = [];
      let reloadLog: string[] = [];

      let persistentProgress = "";

      doc.doReloadEx().then(function (result) {
        setTimeout(function () {
          reloaded = true;
          console.log("");
          console.log("--------------- RELOAD COMPLETED ---------------");
          console.log("");

          if (scriptError == true)
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

          resolve({
            error: scriptError,
            message: {
              success: result.qSuccess,
              log: result.qScriptLogFile,
              script: scriptResult,
              scriptError: scriptError,
              reloadLog,
            },
          });
        }, 1000);
      });

      const progress = setInterval(function () {
        if (reloaded != true) {
          global.getProgress(-1).then(function (msg) {
            const timestampOptions: Intl.DateTimeFormatOptions = {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            };

            const timestamp = new Date().toLocaleString(
              "en-GB",
              timestampOptions
            );

            let loadError = false;

            try {
              loadError =
                msg.qPersistentProgress.toLowerCase().indexOf("script error.") >
                -1
                  ? true
                  : false;
            } catch (e) {}

            if (msg.qErrorData.length > 0 || loadError == true) {
              reloaded = true;
              scriptError = true;
            }

            if (msg.qPersistentProgress && msg.qTransientProgress) {
              persistentProgress = msg.qPersistentProgress;
              if (persistentProgress.split("\n").length > 1) {
                const msg1 = `${timestamp}: ${
                  persistentProgress.split("\n")[0]
                }`;
                console.log(msg1);
                reloadLog.push(msg1);

                const msg2 = `${timestamp}: ${
                  persistentProgress.split("\n")[1]
                } <-- ${msg.qTransientProgress}`;
                console.log(msg2);
                reloadLog.push(msg2);
              } else {
                const msg3 = `${timestamp}: ${msg.qPersistentProgress} <-- ${msg.qTransientProgress}`;
                console.log(msg3);
                reloadLog.push(msg3);
              }
            }

            if (!msg.qPersistentProgress && msg.qTransientProgress) {
              if (persistentProgress.split("\n").length > 1) {
                const msg4 = `${timestamp}: ${
                  persistentProgress.split("\n")[1]
                } <-- ${msg.qTransientProgress}`;

                console.log(msg4);
                reloadLog.push(msg4);
              } else {
                const msg5 = `${timestamp}: ${persistentProgress} <-- ${msg.qTransientProgress}`;
                console.log(msg5);
                reloadLog.push(msg5);
              }
            }

            if (msg.qPersistentProgress && !msg.qTransientProgress) {
              const msg6 = `${timestamp}: ${msg.qPersistentProgress}`;
              console.log(msg6);
              reloadLog.push(msg6);
            }
          });
        } else {
          clearInterval(progress);
        }
      }, 500);
    });
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
