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
    await this.reloadAndGetProgress(global, doc).catch(async (e) => {
      await qlik.session.close();

      throw new CustomError("Error during reload", "error", false);
    });

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
    return new Promise(function (resolve, reject) {
      console.log("");
      console.log("--------------- RELOAD STARTED ---------------");
      console.log("");

      let reloaded = false;
      let scriptError = false;
      let scriptResult = [];

      let persistentProgress = "";

      doc.doReloadEx().then(function (result) {
        setTimeout(function () {
          reloaded = true;
          console.log("");
          console.log("--------------- RELOAD COMPLETED ---------------");
          console.log("");

          if (scriptError == true) reject(scriptError);

          resolve({
            error: scriptError,
            message: {
              success: result.qSuccess,
              log: result.qScriptLogFile,
              script: scriptResult,
              scriptError: scriptError,
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
                console.log(
                  `${timestamp}: ${persistentProgress.split("\n")[0]}`
                );
                console.log(
                  `${timestamp}: ${persistentProgress.split("\n")[1]} <-- ${
                    msg.qTransientProgress
                  }`
                );
              } else {
                console.log(
                  `${timestamp}: ${msg.qPersistentProgress} <-- ${msg.qTransientProgress}`
                );
              }
            }

            if (!msg.qPersistentProgress && msg.qTransientProgress) {
              if (persistentProgress.split("\n").length > 1) {
                console.log(
                  `${timestamp}: ${persistentProgress.split("\n")[1]} <-- ${
                    msg.qTransientProgress
                  }`
                );
              } else {
                console.log(
                  `${timestamp}: ${persistentProgress} <-- ${msg.qTransientProgress}`
                );
              }
            }

            if (msg.qPersistentProgress && !msg.qTransientProgress) {
              console.log(`${timestamp}: ${msg.qPersistentProgress}`);
            }
          });
        } else {
          clearInterval(progress);
        }
      }, 500);
    });
  }
}
