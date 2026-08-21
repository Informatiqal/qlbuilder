import { createWriteStream, existsSync } from "fs";
import {
  DownloadExportRequest,
  PluginArguments,
  PluginMeta,
} from "../../types/types.js";
import { generateXrfkey, uuid } from "../../lib/common.js";
import { CustomError } from "../../lib/CustomError.js";
import axios, { AxiosRequestConfig } from "axios";
import { IConfig } from "../../lib/Config.js";
import { Agent } from "http";

type CommandOptions = {
  nodata: boolean;
  path: string;
};

interface ISaaSItem {
  name: string;
  id: string;
}

const meta: PluginMeta = {
  command: {
    name: "download",
    description: "Download the configured qvf",
    aliases: [],
    argument: "",
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
      {
        flag: "--nd, --nodata <boolean>",
        description: "Download the qvf without data",
        defaultValue: true,
      },
      {
        flag: "-p, --path <path>",
        description: "Location to save the file",
        defaultValue: "./",
      },
    ],
  },
  options: {
    requireConnection: true,
    requireEnv: true,
    requireApp: true,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  downloadFolderExists(args.command.options.path);

  const print = new args.tools.print();
  const spin = new args.tools.spinner("Downloading ...", "arc");

  spin.start();

  let appName = "";

  if (args.environment?.authentication.type == "saas") {
    appName = await getSaaSAppName(
      args.environment.appId,
      args.environment.host,
      args.engine.auth?.data.headers,
    );
    await downloadSaaSFile(
      appName,
      args.environment.appId,
      args.command.options.path,
      args.environment.host,
      args.engine.auth?.data.headers,
    );
  }

  if (args.environment?.authentication.type !== "saas") {
    const exportRequest = await getExportRequest(
      args.environment as IConfig,
      args.command.options.nodata,
      args.engine.auth?.httpsAgent,
      args.engine.auth?.data.headers,
    );

    appName = exportRequest.fileName;
    await downloadFile(
      appName,
      exportRequest.path,
      args.command.options.path,
      args.environment?.host,
      args.engine.auth?.data.headers,
    );
  }

  spin.stop();
  print.ok("Download was complete");

  return true;
}

function downloadFolderExists(downloadFolder: string) {
  if (!existsSync(downloadFolder)) {
    // this.spin.stop();
    throw new CustomError(
      `Specified download path do not exists: ${downloadFolder}`,
      "error",
      true,
    );
  }
}

async function getExportRequest(
  environment: IConfig,
  nodata: boolean,
  httpsAgent: Agent | undefined,
  headers?: {
    Cookie?: string;
    Authorization?: string;
  },
): Promise<DownloadExportRequest> {
  const token = uuid();
  const xrfkey = generateXrfkey();

  const port: string =
    environment.authentication.type == "certificates" ? ":4242" : "";

  const apiURL = `${environment.host}${port}/qrs/app/${
    environment.appId
  }/export/${token}?Xrfkey=${xrfkey}${nodata == true ? "&skipdata=true" : ""}`;

  let requestConfig: AxiosRequestConfig = {
    headers: { ...headers, "X-Qlik-Xrfkey": xrfkey },
    withCredentials: true,
  };

  if (environment.authentication.type == "certificates")
    requestConfig.httpsAgent = httpsAgent;

  return await axios
    .post(apiURL, {}, requestConfig)
    .then((res) => ({
      fileName: decodeURI(res.data.downloadPath.split("/")[3].split("?")[0]),
      path: res.data.downloadPath,
    }))
    .catch((e) => {
      //   this.spin.stop();
      throw new CustomError(e.message, "error", true);
    });
}

async function downloadFile(
  fileName,
  tempContentPath,
  path,
  host,
  headers,
): Promise<void> {
  const writer = createWriteStream(`${path}/${fileName}`);
  const xrfkey = generateXrfkey();

  await axios
    .get(`${host}${tempContentPath}&Xrfkey=${xrfkey}`, {
      headers: { ...headers, "X-Qlik-Xrfkey": xrfkey },
      withCredentials: true,
      responseType: "stream",
    })
    .then((res) => {
      return new Promise((resolve, reject) => {
        res.data.pipe(writer);
        let error = null;
        writer.on("error", (err) => {
          writer.close();
          //   this.spin.stop();
          throw new CustomError(err.message, "error", true);
        });
        writer.on("close", () => {
          if (!error) resolve(true);
        });
      });
    })
    .catch((e) => {
      //   this.spin.stop();
      throw new CustomError(e.message, "error", true);
    });

  return;
}

async function downloadSaaSFile(
  fileName: string,
  appId: string,
  path: string,
  host: string,
  headers?: {
    Cookie?: string;
    Authorization?: string;
  },
) {
  const writer = createWriteStream(`${path}/${fileName}.qvf`);

  await axios
    .post(
      `${host}/api/v1/apps/${appId}/export`,
      {},
      {
        headers: { ...headers },
        responseType: "stream",
      },
    )
    .then((res) => {
      return new Promise((resolve, reject) => {
        res.data.pipe(writer);
        let error = null;
        writer.on("error", (err) => {
          writer.close();
          //   this.spin.stop();
          throw new CustomError(err.message, "error", true);
        });
        writer.on("close", () => {
          if (!error) resolve(true);
        });
      });
    })
    .catch((e) => {
      //   this.spin.stop();
      throw new CustomError(e.message, "error", true);
    });
}

async function getSaaSAppName(
  appId: string,
  host: string,
  headers?: {
    Cookie?: string;
    Authorization?: string;
  },
) {
  return await axios
    .get<{ data: ISaaSItem[] }>(
      `${host}/api/v1/items?resourceType=app&resourceId=${appId}`,
      {
        headers: { ...headers },
      },
    )
    .then((res) => {
      if (!res.data || !res.data.data || res.data.data.length == 0)
        throw new CustomError(
          `App with id "${appId}" do not exists`,
          "error",
          true,
        );
      return res.data.data[0].name;
    });
}

export { meta, action };
