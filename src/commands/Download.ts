import { existsSync, createWriteStream } from "fs";
import axios, { AxiosRequestConfig } from "axios";
import { Checks } from "../lib/Checks";
import { CustomError } from "../lib/CustomError";
import { Config, IConfig } from "../lib/Config";
import { Auth } from "../lib/Auth";
import { generateXrfkey, uuid } from "../lib/common";
import { Spin } from "../lib/Spinner";
import { DownloadExportRequest, DownloadOptionValues } from "../types/types";

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
        `Specified download path do now exists: ${downloadFolder}`,
        "error",
        true
      );
    }
  }

  async run() {
    this.spin.start();

    await this.auth[this.environment.authentication.type]();

    const exportRequest = await this.getExportRequest(this.auth.data.headers);

    await this.downloadFile(exportRequest.fileName, exportRequest.path);

    this.spin.stop();
    return exportRequest.fileName;
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
}
