import axios, { AxiosRequestConfig } from "axios";
import { IConfig } from "../../lib/Config.js";
import { PluginArguments, PluginMeta, RepoApp } from "../../types/types.js";
import { Spin } from "../../lib/Spinner.js";
import { CustomError } from "../../lib/CustomError.js";
import { generateXrfkey } from "../../lib/common.js";
import { Auth } from "../../lib/Auth.js";
import { writeFileSync } from "fs";

const meta: PluginMeta = {
  command: {
    name: "appDetails",
    description: "Some description",
    aliases: ["appdetails", "details"],
    options: [
      {
        flag: "--output <path>",
        description:
          "Optional. Path. Save the output to a file. (Console output is still shown)",
        defaultValue: undefined,
      },
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
      },
    ],
  },
  options: {
    requireConnection: true,
    requireEnv: true,
  },
};

async function action(args: PluginArguments) {
  if (args.environment && args.engine.auth) {
    if (args.environment.host.indexOf("qlikcloud") > -1) {
      console.log(
        "This command is only supported for On-prem ... for now. More development to follow.",
      );
      process.exit(0);
    }

    const spin = new args.tools.spinner("Getting app metadata ...", "arc");
    spin.start();

    const details = await getAppDetailsRepo(
      args.environment,
      args.engine.auth,
      spin,
    );
    details.data["host"] = args.environment.host;
    spin.stop();
    const formattedDetails = printDetails(details.data);

    if (args.command.options.output) {
      try {
        writeFileSync(args.command.options.output as string, formattedDetails);
      } catch (e: any) {
        throw new Error(e.message);
      }
    }

    return true;
  }
}

async function getAppDetailsRepo(environment: IConfig, auth: Auth, spin: Spin) {
  const xrfkey = generateXrfkey();

  const port: string =
    environment.authentication.type == "certificates" ? ":4242" : "";

  const apiURL = `${environment.host}${port}/qrs/app/${environment.appId}?Xrfkey=${xrfkey}`;

  const requestConfig: AxiosRequestConfig = {
    headers: { ...auth.data.headers, "X-Qlik-Xrfkey": xrfkey },
    withCredentials: true,
  };

  if (environment.authentication.type == "certificates")
    requestConfig.httpsAgent = auth.httpsAgent;

  return await axios.get<RepoApp>(apiURL, requestConfig).catch((e) => {
    spin.stop();
    throw new CustomError(e.message, "error", true);
  });
}

function printDetails(details: RepoApp) {
  const consoleMessages: string[][] = [];

  consoleMessages.push(["Host", details["host"]]);
  consoleMessages.push(["ID", details.id]);
  consoleMessages.push(["Name", details.name]);
  consoleMessages.push([
    "Owner",
    `${details.owner.userDirectory}\\${details.owner.userId}`,
  ]);
  consoleMessages.push(["File size", formatBytes(details.fileSize)]);
  consoleMessages.push(["Published", `${details.published}`]);

  if (details.published == true) {
    consoleMessages.push(["Published time", details.publishTime]);
    consoleMessages.push(["Stream", details.stream.name]);
  }

  consoleMessages.push(["Created at", details.createdDate]);
  consoleMessages.push(["Modified at", details.modifiedDate]);
  consoleMessages.push(["Modified by", details.modifiedByUserName]);
  consoleMessages.push(["Last reload at", details.lastReloadTime]);
  consoleMessages.push(["Saved in version", details.savedInProductVersion]);

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
        ...details.customProperties.map((cp) => cp.definition.name.length),
      );

      // add the cp name to the main object (grouping and sorting is easier like that)
      details.customProperties = details.customProperties.map((cp) => {
        cp["name"] = cp.definition.name;
        return cp;
      });

      // sort the CP by the cp name
      details.customProperties = details.customProperties.sort((a, b) => {
        //@ts-ignore
        if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
        //@ts-ignore
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
      //@ts-ignore
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
    ...consoleMessages.map((c) => c[0].length),
  );

  console.log("");
  const formattedMessages: string[] = [];
  consoleMessages.map((cm) => {
    const l = cm[0].padEnd(maxPropNameLength, " ");

    if (cm[0].length == 0 && cm[1].length > 1) {
      const msg = `${l}  ${cm[1]}`;
      console.log(msg);
      formattedMessages.push(msg);
    } else {
      const msg = `${l}: ${cm[1]}`;
      console.log(msg);
      formattedMessages.push(msg);
    }
  });

  return formattedMessages.join("\n");
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
}

export { meta, action };
