import { readFileSync } from "fs";
import { load as yamlLoad } from "js-yaml";
import { AuthType } from "../types/types";
import { CustomError } from "./CustomError";

export interface IConfig {
  name: string;
  host: string;
  engineHost?: string;
  secure?: boolean;
  trustAllCerts?: boolean;
  appId: string;
  authentication: {
    type: AuthType;
  };
}

export interface IConfigExtended extends IConfig {
  engineHost: string;
}

export class Config {
  private envName: string;
  envDetails: IConfig;
  constructor(envName: string) {
    this.envName = envName;
    try {
      const config = yamlLoad(
        readFileSync(`${process.cwd()}/config.yml`).toString()
      ) as IConfig[];

      if (config.length == 0)
        throw new CustomError(
          "No environments found in the config file",
          "error",
          true
        );

      const envDetails = config.filter((e) => e.name == envName);

      // if no environments exists
      if (envDetails.length == 0)
        throw new CustomError(
          `The specified environment (${envName}) do not exists in the config`,
          "error",
          true
        );

      // if duplicate environments exists in the config
      if (envDetails.length > 1)
        throw new CustomError(
          `Multiple environments with the same name - ${envName}`,
          "error",
          true
        );

      // if environment exists and trustAllCerts is true then
      // ignore all certificates errors
      if (
        envDetails[0].hasOwnProperty("trustAllCerts") &&
        envDetails[0].trustAllCerts == true
      )
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

      // remove trailing slashed from the end of the host (if any) #17
      envDetails[0].host = envDetails[0].host.replace(/\/+$/g, "");

      envDetails[0].engineHost = `${envDetails[0].secure ? "wss" : "ws"}://${
        envDetails[0].host
      }`;
      envDetails[0].host = `${envDetails[0].secure ? "https" : "http"}://${
        envDetails[0].host
      }`;

      this.envDetails = envDetails[0];
    } catch (e) {
      throw new CustomError(e.message, "error", true);
    }
  }
}
