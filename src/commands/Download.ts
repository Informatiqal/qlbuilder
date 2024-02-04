import { existsSync, createWriteStream } from "fs";
import axios, { AxiosRequestConfig } from "axios";
import { Checks } from "../lib/Checks";
import { CustomError } from "../lib/CustomError";
import { Config, IConfig } from "../lib/Config";
import { Auth } from "../lib/Auth";
import { generateXrfkey, uuid } from "../lib/common";
import { Spin } from "../lib/Spinner";
import { DownloadExportRequest, DownloadOptionValues } from "../types/types";

export interface ISaaSItem {
  name: string;
  id: string;
}

export class Download {
  private name: string;
  private environment: IConfig;
  private auth: Auth;
  private options: DownloadOptionValues;
  private spin: Spin;
  constructor(name: string, options: DownloadOptionValues) {
    this.name = name;
    this.options = options;
    this.spin = new Spin("Downloading ...", "arc");

    const checks = new Checks();
    checks.all();

    this.downloadFolderExists(options.path);

    const config = new Config(this.name);
    this.environment = config.envDetails;

    this.auth = new Auth(this.environment);
  }

  private downloadFolderExists(downloadFolder: string) {
    if (!existsSync(downloadFolder)) {
      this.spin.stop();
      throw new CustomError(
        `Specified download path do not exists: ${downloadFolder}`,
        "error",
        true
      );
    }
  }

  async run() {
    this.spin.start();

    const auth = this.authMethod();
    await auth();

    let appName: string = "";

    if (this.environment.authentication.type == "saas") {
      appName = await this.getSaaSAppName(this.environment.appId);
      await this.downloadSaaSFile(appName, this.environment.appId);
    }

    if (this.environment.authentication.type !== "saas") {
      const exportRequest = await this.getExportRequest(this.auth.data.headers);

      appName = exportRequest.fileName;
      await this.downloadFile(appName, exportRequest.path);
    }

    this.spin.stop();
    return appName;
  }

  private authMethod() {
    // QS desktop. Ignore any auth props (present or not)
    if (this.environment.host.indexOf(":4848") > -1)
      throw new CustomError(
        `"Download" command is not available for QS Desktop. Copy the file from QS Apps folder`,
        "error",
        true
      );

    // for anything else raise an error
    if (!this.auth[this.environment.authentication.type])
      throw new CustomError(
        `Invalid authentication method - ${this.environment.authentication.type}`,
        "error",
        true
      );

    return () => this.auth[this.environment.authentication.type]();
  }

  private async getExportRequest(headers?: {
    Cookie?: string;
    Authorization?: string;
  }): Promise<DownloadExportRequest> {
    const token = uuid();
    const xrfkey = generateXrfkey();

    const port: string =
      this.environment.authentication.type == "certificates" ? ":4242" : "";

    const apiURL = `${this.environment.host}${port}/qrs/app/${
      this.environment.appId
    }/export/${token}?Xrfkey=${xrfkey}${
      this.options.nodata == "true" ? "&skipdata=true" : ""
    }`;

    let requestConfig: AxiosRequestConfig = {
      headers: { ...headers, "X-Qlik-Xrfkey": xrfkey },
      withCredentials: true,
    };

    if (this.environment.authentication.type == "certificates")
      requestConfig.httpsAgent = this.auth.httpsAgent;

    return await axios
      .post(apiURL, {}, requestConfig)
      .then((res) => ({
        fileName: decodeURI(res.data.downloadPath.split("/")[3].split("?")[0]),
        path: res.data.downloadPath,
      }))
      .catch((e) => {
        this.spin.stop();
        throw new CustomError(e.message, "error", true);
      });
  }

  private async downloadFile(fileName, tempContentPath): Promise<void> {
    const writer = createWriteStream(`${this.options.path}/${fileName}`);
    const xrfkey = generateXrfkey();

    await axios
      .get(`${this.environment.host}${tempContentPath}&Xrfkey=${xrfkey}`, {
        headers: { ...this.auth.data.headers, "X-Qlik-Xrfkey": xrfkey },
        withCredentials: true,
        responseType: "stream",
      })
      .then((res) => {
        return new Promise((resolve, reject) => {
          res.data.pipe(writer);
          let error = null;
          writer.on("error", (err) => {
            writer.close();
            this.spin.stop();
            throw new CustomError(err.message, "error", true);
          });
          writer.on("close", () => {
            if (!error) resolve(true);
          });
        });
      })
      .catch((e) => {
        this.spin.stop();
        throw new CustomError(e.message, "error", true);
      });
  }

  private async downloadSaaSFile(fileName: string, appId: string) {
    const writer = createWriteStream(`${this.options.path}/${fileName}.qvf`);

    await axios
      .post(
        `${this.environment.host}/api/v1/apps/${appId}/export`,
        {},
        {
          headers: { ...this.auth.data.headers },
          responseType: "stream",
        }
      )
      .then((res) => {
        return new Promise((resolve, reject) => {
          res.data.pipe(writer);
          let error = null;
          writer.on("error", (err) => {
            writer.close();
            this.spin.stop();
            throw new CustomError(err.message, "error", true);
          });
          writer.on("close", () => {
            if (!error) resolve(true);
          });
        });
      })
      .catch((e) => {
        this.spin.stop();
        throw new CustomError(e.message, "error", true);
      });
  }

  private async getSaaSAppName(appId: string) {
    return await axios
      .get<{ data: ISaaSItem[] }>(
        `${this.environment.host}/api/v1/items?resourceType=app&resourceId=${appId}`,
        {
          headers: { ...this.auth.data.headers },
        }
      )
      .then((res) => {
        if (!res.data || !res.data.data || res.data.data.length == 0)
          throw new CustomError(
            `App with id "${appId}" do not exists`,
            "error",
            true
          );
        return res.data.data[0].name;
      });
  }
}
