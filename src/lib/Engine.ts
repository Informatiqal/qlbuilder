import { appendFileSync, existsSync, mkdirSync } from "fs";
import { homedir, EOL } from "os";
import { WebSocket } from "ws";
import enigma from "enigma.js";
import schema from "enigma.js/schemas/12.1306.0.json";

export class Engine {
  session: enigmaJS.ISession;
  private builderHomeFolder = `${homedir}/qlBuilder`;
  private trafficFile: string;
  constructor(engineHost, appId, headers, name, isDebug) {
    this.trafficFile = `${homedir}\\qlBuilder\\traffic_${name}.txt`;
    this.session = enigma.create({
      schema,
      url: `${engineHost}/app/${appId}/identity/${+new Date()}`,
      createSocket: (url) =>
        new WebSocket(url, {
          headers: headers,
          rejectUnauthorized: false,
        }),
    });

    if (!existsSync(this.builderHomeFolder)) mkdirSync(`${homedir}/qlBuilder`);

    if (isDebug == true) {
      const _this = this;
      this.session.on("traffic:*", function (direction, data) {
        try {
          appendFileSync(
            _this.trafficFile,
            `${new Date().toISOString()} ${direction
              .toString()
              .toUpperCase()} ${JSON.stringify(data)} ${EOL}`,
            "utf8"
          );
        } catch (e) {}
      });
    }
  }
}
