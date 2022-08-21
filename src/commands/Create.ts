import { userInfo } from "os";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { dump } from "js-yaml";
import { CustomError } from "../lib/CustomError";
import { Build } from "./Build";

export class Create {
  private name: string;
  private currentFolder = process.cwd();
  private createVSCodeStructure = false;
  constructor(name: string, createVSCodeStructure: boolean) {
    this.name = name;

    this.createVSCodeStructure = createVSCodeStructure;
  }

  run() {
    if (existsSync(`${this.currentFolder}/${this.name}`))
      throw new CustomError(
        `"${this.name}" folder already exists`,
        "error",
        true
      );

    this.createInitFolders();
    this.createInitScriptFiles();
    this.createInitConfig();
    this.createGitIgnore();
    this.createReadMe();
    this.createVSCodeTasks();
  }

  private createInitFolders() {
    mkdirSync(`${this.currentFolder}/${this.name}`);
    mkdirSync(`${this.currentFolder}/${this.name}/src`);
    mkdirSync(`${this.currentFolder}/${this.name}/dist`);
  }

  private createInitScriptFiles() {
    const rawScript = [
      `SET ThousandSep=',';\n`,
      `SET DecimalSep='.';\n`,
      `SET MoneyThousandSep=',';\n`,
      `SET MoneyDecimalSep='.';\n`,
      `SET MoneyFormat='$#,##0.00;($#,##0.00)';\n`,
      `SET TimeFormat='h:mm:ss TT';\n`,
      `SET DateFormat='M/D/YYYY';\n`,
      `SET TimestampFormat='M/D/YYYY h:mm:ss[.fff] TT';\n`,
      `SET MonthNames='Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec';\n`,
      `SET DayNames='Mon;Tue;Wed;Thu;Fri;Sat;Sun';\n`,
    ];

    writeFileSync(
      `${this.currentFolder}/${this.name}/src/0--Main.qvs`,
      rawScript.join("")
    );

    const build = new Build(`${this.currentFolder}/${this.name}`, true);
    build.run();
  }

  private createInitConfig() {
    const defaultConfig = [
      {
        name: "desktop",
        host: "localhost:4848",
        secure: false,
        appId: `C:/Users/${
          userInfo().username
        }/Documents/Qlik/Sense/Apps/test.qvf`,
      },
      {
        name: "qse-certificates",
        host: "my-qs-engine-host:4747",
        secure: true,
        trustAllCerts: true,
        appId: "12345678-1234-1234-1234-12345678901",
        authentication: {
          type: "certificates",
          certLocation: "C:/path/to/cert/folder",
          user: "DOMAIN\\username",
        },
      },
      {
        name: "jwt",
        host: "my-qs-engine-host/virtual-proxy-prefix",
        secure: true,
        trustAllCerts: true,
        appId: "12345678-1234-1234-1234-12345678901",
        authentication: {
          type: "jwt",
          sessionHeaderName: "X-Qlik-Session",
        },
      },
      {
        name: "winform",
        host: "my-qs-proxy",
        secure: true,
        trustAllCerts: true,
        appId: "12345678-1234-1234-1234-12345678901",
        authentication: {
          type: "winform",
          sessionHeaderName: "X-Qlik-Session",
        },
      },
      {
        name: "saas",
        host: "my-qs-proxy",
        secure: true,
        trustAllCerts: true,
        appId: "12345678-1234-1234-1234-12345678901",
        authentication: {
          type: "saas",
        },
      },
    ];

    writeFileSync(
      `${this.currentFolder}/${this.name}/config.yml`,
      dump(defaultConfig)
    );
  }

  private createGitIgnore() {
    writeFileSync(
      `${this.currentFolder}/${this.name}/.gitignore`,
      "session.txt"
    );
  }

  private createReadMe() {
    const readmeContent = `# qlBuilder

## Config

The first step is to edit \`config.yml\` file

- initially it contains multiple example configurations. At the end it should contain only one. Remove the configurations that are not applied to the target environment
- once only one configuration is available now is time to edit it:
  - \`name\` - it should match a value from \`.qlbuilder.yml\` value
  - \`host\` - without \`https://\` or \`http://\` prefix
  - \`secure\` - \`true\` or \`false\`. Depends if the target environment is \`https\` or \`http\`
  - \`appId\` - the target Qlik application id
  - \`trustAllCerts\` - \`true\` or \`false\`. If \`true\` all certificate issues will be ignored e.g. self-signed certificates. Also if \`true\` a warning message will be shown that certificate issues are ignored
  - \`authentication\` - depends on your environment. The important bit is if the environment is QSEoW and the connection is established via Virtual Proxy or the default VP session cookie is not the default one then include \`sessionHeaderName\` value. If \`sessionHeaderName\` is not provided then the default value is used \`X-Qlik-Session\`

## Usage

To view all commands just run \`qlbuilder\` command in the terminal/command prompt

## Issues and Questions

If you have any questions or issues then please open an [GitHub issue](https://github.com/Informatiqal/qlbuilder/issues)

## Funding

And if you find this project useful please consider donating ot its development [Ko-Fi](https://ko-fi.com/stefanstoichev)

Thank you!
`;

    writeFileSync(
      `${this.currentFolder}/${this.name}/README.md`,
      readmeContent
    );
  }

  createVSCodeTasks() {
    if (this.createVSCodeStructure == true) {
      const vscode = {
        tasks: function () {
          return JSON.stringify(
            {
              version: "2.0.0",
              tasks: [
                {
                  label: "Set Script",
                  detail: "Upload (set) the script to the Qlik app",
                  type: "shell",
                  command: "qlbuilder setscript ${config:env}",
                },
                {
                  label: "Get Script",
                  detail:
                    "Download (get) the script from the Qlik app and save it as local files",
                  type: "shell",
                  command: "qlbuilder getscript ${config:env}",
                },
                {
                  label: "Check Script",
                  detail:
                    "Check the script for syntax errors. The script is NOT set in the target app",
                  type: "shell",
                  command: "qlbuilder checkscript ${config:env}",
                },
                {
                  label: "Build",
                  detail:
                    'Concatenate all local files to the "dist" folder. Nothing is uploaded',
                  type: "shell",
                  command: "qlbuilder build",
                },
                {
                  label: "Reload",
                  detail:
                    "Upload (set) the script to the Qlik app and reloads it",
                  type: "shell",
                  command: "qlbuilder reload ${config:env}",
                },
                {
                  label: "Watch",
                  detail:
                    "Start qlbuilder in watch mode. Checks the script for syntax errors on each file save",
                  type: "shell",
                  command: "qlbuilder watch  ${config:env}",
                },
                {
                  label: "Watch Set Script",
                  detail:
                    "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save",
                  type: "shell",
                  command: "qlbuilder watch  ${config:env} -s",
                },
                {
                  label: "Watch Set Script and Reload",
                  type: "shell",
                  detail:
                    "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save and automatically trigger reload after this",
                  command: "qlbuilder watch  ${config:env} -r",
                },
              ],
            },
            null,
            4
          );
        },
        settings: function () {
          return JSON.stringify(
            {
              env: "environment name here",
            },
            null,
            4
          );
        },
      };

      mkdirSync(`${this.currentFolder}/${this.name}/.vscode`);
      writeFileSync(
        `${this.currentFolder}/${this.name}/.vscode/tasks.json`,
        vscode.tasks()
      );
      writeFileSync(
        `${this.currentFolder}/${this.name}/.vscode/settings.json`,
        vscode.settings()
      );
    }
  }
}
