import { readFileSync } from "fs";
import { Agent } from "https";
import { homedir } from "os";
import qAuth from "qlik-sense-authenticate";
import { load as yamlLoad } from "js-yaml";
import chalk from "chalk";

import { IConfig } from "./Config";
import { CustomError } from "./CustomError";
import {
  CertificatesCredentials,
  TokenCredentials,
  WinFormCredentials,
} from "../types/types";

export class Auth {
  private auth_config = {
    winform: ["QLIK_USER", "QLIK_PASSWORD"],
    jwt: ["QLIK_TOKEN"],
    certificates: ["QLIK_CERTS", "QLIK_USER"],
    saas: ["QLIK_TOKEN"],
  };
  config: IConfig;
  httpsAgent: Agent;
  data: {
    key?: string | Buffer;
    cert?: string | Buffer;
    headers?: {
      Authorization?: string;
      Cookie?: string;
      "X-Qlik-User"?: string;
    };
  } = {};
  constructor(config: IConfig) {
    this.config = config;
  }
  async desktop() {}

  async certificates() {
    const credentials: CertificatesCredentials = this.credentials();

    if (credentials.QLIK_USER.indexOf("\\") == -1)
      throw new CustomError(
        "The username should be in format DOMAIN\\USER",
        "error",
        true
      );

    const a = {
      key: readFileSync(`${credentials.QLIK_CERTS}/client_key.pem`),
      cert: readFileSync(`${credentials.QLIK_CERTS}/client.pem`),
      headers: {
        "X-Qlik-User": `UserDirectory=${encodeURIComponent(
          credentials.QLIK_USER.split("\\")[0]
        )};UserId=${encodeURIComponent(credentials.QLIK_USER.split("\\")[1])}`,
      },
    };

    this.data.headers = a.headers;

    this.httpsAgent = new Agent({
      key: a.key,
      cert: a.cert,
    });
  }

  async jwt() {
    const credentials: TokenCredentials = this.credentials();

    this.data.headers = { Authorization: `Bearer ${credentials.QLIK_TOKEN}` };
  }

  async winform(): Promise<void> {
    const credentials: WinFormCredentials = this.credentials();

    const sessionHeaderName = (this.config.authentication as any)
      .sessionHeaderName
      ? (this.config.authentication as any).sessionHeaderName
      : "X-Qlik-Session";

    if (credentials.QLIK_USER.indexOf("\\") == -1)
      throw new CustomError(
        "The username should be in format DOMAIN\\USER",
        "error",
        true
      );

    // try and extract the virtual proxy (if exists)
    // false assumption before that "win" authentication
    // can be only on the main virtual proxy
    const urlParts = this.config.host.split("/");

    const auth_config = {
      type: "win",
      props: {
        url: this.config.host,
        proxy: urlParts[3] ? urlParts[3] : "",
        username: credentials.QLIK_USER,
        password: credentials.QLIK_PASSWORD,
        header: sessionHeaderName,
        rejectUnauthorized: false,
      },
    };

    try {
      const { error, message: sessionId } = await qAuth.login(auth_config);

      if (error == true) throw new CustomError(sessionId, "error", true);

      this.data = {
        headers: {
          Cookie: `${sessionHeaderName}=${sessionId}`,
        },
      };
    } catch (e) {
      throw new CustomError(e.message, "error", true);
    }
  }

  async saas() {
    const credentials: TokenCredentials = this.credentials();

    this.data.headers = { Authorization: `Bearer ${credentials.QLIK_TOKEN}` };
  }

  private localConfig() {
    const envName = this.config.name;

    let configs: any = {};
    try {
      configs = yamlLoad(readFileSync(`${homedir}/.qlbuilder.yml`).toString());
    } catch (e) {
      throw new Error(e.message);
    }

    if (!configs[envName])
      throw new Error(`"${envName}" not found in .qlBuilder.yml`);

    return configs[envName];
  }

  private localVariables() {
    const reqVariables = this.auth_config[
      this.config.authentication.type
    ] as string[];

    const reqVariablesValues = {};

    reqVariables.map((v) => {
      if (!process.env[v])
        throw new Error(`At least one of the environment variables is not set`);

      reqVariablesValues[v] = process.env[v];
    });

    return reqVariablesValues;
  }

  private credentials<T>(): T {
    let isYmlFileOk = true;
    let isEnvVarsOk = true;

    let ymlFileCredentials;
    let envVarsCredentials;

    let ymlFileError = "";
    let envVarError = "";

    try {
      ymlFileCredentials = this.localConfig();
    } catch (e) {
      isYmlFileOk = false;
      ymlFileError = e.message;
    }

    try {
      envVarsCredentials = this.localVariables();
    } catch (e) {
      isEnvVarsOk = false;
      envVarError = e.message;
    }

    if (isEnvVarsOk == false && isYmlFileOk == false)
      throw new CustomError(
        `${chalk.red(ymlFileError)} OR ${chalk.red(envVarError)}`,
        "error",
        true
      );

    if (isEnvVarsOk == true && isYmlFileOk == false)
      return envVarsCredentials as T;
    if (isEnvVarsOk == false && isYmlFileOk == true)
      return ymlFileCredentials as T;
    if (isEnvVarsOk == true && isYmlFileOk == true)
      return envVarsCredentials as T;
  }
}
