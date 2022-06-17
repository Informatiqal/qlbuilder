import axios from "axios";
import { combined } from "../packages/initialChecks.js";
import { writeLog, uuid, generateXrfkey } from "../packages/common.js";
import { handleAuthenticationType } from "../packages/qlik-comm.js";
import { createWriteStream } from "fs";

export async function download(envName, options) {
  const checks = combined(envName);
  if (checks.error) writeLog("err", checks.message, true);

  const qsEnt = await handleAuthenticationType[
    checks.message.env.authentication.type
  ]({
    environment: checks.message.env,
    variables: checks.message.variables,
  });

  if (qsEnt.error == true) return qsEnt;

  const headers = qsEnt.message.headers;

  const downloadResponse = await getExportRequest(
    checks.message.env.host,
    checks.message.env.appId,
    headers,
    options.nodata
  );

  if (downloadResponse.error == true) return downloadResponse;

  const downloadAndSaveResponse = await downloadFile(
    checks.message.env.host,
    headers,
    downloadResponse.message.path,
    downloadResponse.message.fileName,
    options.path
  );

  return downloadAndSaveResponse;
}

async function getExportRequest(host, appId, headers, nodata) {
  const token = uuid();
  const xrfkey = generateXrfkey();

  const apiURL = `${host}/qrs/app/${appId}/export/${token}?Xrfkey=${xrfkey}${
    nodata == "true" ? "&skipdata=true" : ""
  }`;

  return await axios
    .post(
      apiURL,
      {},
      {
        headers: { ...headers, "X-Qlik-Xrfkey": xrfkey },
        withCredentials: true,
      }
    )
    .then((res) => ({
      error: false,
      message: {
        fileName: decodeURI(res.data.downloadPath.split("/")[3].split("?")[0]),
        path: res.data.downloadPath,
      },
    }))
    .catch((e) => ({
      error: true,
      message: e.message,
    }));
}

async function downloadFile(
  host,
  headers,
  tempContentPath,
  fileName,
  downloadPath
) {
  const writer = createWriteStream(`${downloadPath}/${fileName}`);
  const xrfkey = generateXrfkey();

  return await axios
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
          error = err;
          writer.close();
          reject({
            error: true,
            message: error.message,
          });
        });
        writer.on("close", () => {
          if (!error) {
            resolve({
              error: false,
              message: `"${fileName}" was downloaded in "${downloadPath}"`,
            });
          }
        });
      });
    })
    .catch((e) => ({
      error: true,
      message: e.message,
    }));
}
