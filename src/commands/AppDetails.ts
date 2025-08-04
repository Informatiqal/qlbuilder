import { Auth } from "../lib/Auth";
import { Checks } from "../lib/Checks";
import { Config, IConfig } from "../lib/Config";
import { CustomError } from "../lib/CustomError";
import { Spin } from "../lib/Spinner";
import { GetScriptOptionValues, RepoApp } from "../types/types";
import { Print } from "../lib/Print";
import { generateXrfkey } from "../lib/common";
import axios, { AxiosRequestConfig } from "axios";

export interface ICreateAppResponse {
  qSuccess: boolean;
  qAppId: string;
}

export interface qMeta {
  canCreateDataConnections: boolean;
  createdDate: string;
  description: string;
  dynamicColor: string;
  modifiedDate: string;
  published: boolean;
  publishTime?: string;
  stream?: {
    id: string;
    name: string;
  };
}

export class AppDetails {
  private auth: Auth;
  private environment: IConfig;
  private options: GetScriptOptionValues;
  private session: enigmaJS.ISession;
  private spin: Spin;
  private print: Print;
  constructor(env: string, options: GetScriptOptionValues) {
    this.print = new Print();
    this.options = options;
    this.spin = new Spin("Getting app metadata ...", "arc");

    const checks = new Checks();
    checks.configFileExists();
    checks.environmentExists();

    const config = new Config(env);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  async run() {
    if (this.environment.host.indexOf("qlikcloud") > -1) {
      console.log(
        "This command is only supported for On-prem ... for now. More development to follow."
      );
      process.exit(0);
    }

    const auth = this.authMethod();
    await auth();

    this.spin.start();

    const details = await this.getAppDetailsRepo();
    this.printDetails(details.data);

    this.spin.stop();
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

  private async getAppDetailsRepo() {
    const xrfkey = generateXrfkey();

    const port: string =
      this.environment.authentication.type == "certificates" ? ":4242" : "";

    const apiURL = `${this.environment.host}${port}/qrs/app/${this.environment.appId}?Xrfkey=${xrfkey}`;

    const requestConfig: AxiosRequestConfig = {
      headers: { ...this.auth.data.headers, "X-Qlik-Xrfkey": xrfkey },
      withCredentials: true,
    };

    if (this.environment.authentication.type == "certificates")
      requestConfig.httpsAgent = this.auth.httpsAgent;

    return await axios.get<RepoApp>(apiURL, requestConfig).catch((e) => {
      this.spin.stop();
      throw new CustomError(e.message, "error", true);
    });
  }

  printDetails(details: RepoApp) {
    const consoleMessages: string[][] = [];

    consoleMessages.push(["ID", details.id]);
    consoleMessages.push(["Name", details.name]);
    consoleMessages.push(["Published", `${details.published}`]);

    if (details.published == true) {
      consoleMessages.push(["Published time", details.publishTime]);
      consoleMessages.push(["Stream", details.stream.name]);
    }

    consoleMessages.push(["Created at", details.createdDate]);
    consoleMessages.push(["Modified at", details.modifiedDate]);
    consoleMessages.push(["Modified by", details.modifiedByUserName]);
    consoleMessages.push(["Last reloaded at", details.lastReloadTime]);
    consoleMessages.push(["Saved in version", details.savedInProductVersion]);
    consoleMessages.push([
      "Owner",
      `${details.owner.userDirectory}\\${details.owner.userId}`,
    ]);
    consoleMessages.push(["File size", this.formatBytes(details.fileSize)]);

    if (details.tags) {
      if (details.tags.length > 0) {
        const tags = details.tags
          .map((t) => t.name)
          .sort()
          .join(", ");
        consoleMessages.push(["Tags", tags]);
      } else {
        consoleMessages.push(["Tags", "-"]);
      }
    }

    if (details.customProperties) {
      if (details.customProperties.length > 0) {
        const maxPropNameLength = Math.max(
          ...details.customProperties.map((cp) => cp.definition.name.length)
        );

        // add the cp name to the main object (grouping and sorting is easier like that)
        details.customProperties = details.customProperties.map((cp) => {
          cp["name"] = cp.definition.name;
          return cp;
        });

        // sort the CP by the cp name
        details.customProperties = details.customProperties.sort((a, b) => {
          if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
          if (a.name.toUpperCase() > b.name.toUpperCase()) return 1;
          return 0;
        });

        // group the CPs by their name
        const cpGrouped = details.customProperties.reduce((hash, obj) => {
          if (obj["name"] === undefined) return hash;
          return Object.assign(hash, {
            [obj["name"]]: (hash[obj["name"]] || []).concat(obj.value),
          });
        }, {});

        // loop through the newly formed keys and print what is needed
        Object.entries(cpGrouped).forEach((cp: [string, [string]], i) => {
          if (i == 0) {
            consoleMessages.push([
              "Custom properties",
              `${cp[0].padEnd(maxPropNameLength)}-> ${cp[1].sort().join(", ")}`,
            ]);
          } else {
            consoleMessages.push([
              "",
              `${cp[0].padEnd(maxPropNameLength)}-> ${cp[1].sort().join(", ")}`,
            ]);
          }
        });
      } else {
        consoleMessages.push(["Custom properties", "-"]);
      }
    }

    const maxPropNameLength = Math.max(
      ...consoleMessages.map((c) => c[0].length)
    );

    consoleMessages.map((cm) => {
      const l = cm[0].padEnd(maxPropNameLength, " ");

      if (cm[0].length == 0 && cm[1].length > 1) {
        console.log(`${l}  ${cm[1]}`);
      } else {
        console.log(`${l}: ${cm[1]}`);
      }
    });
  }

  private formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
