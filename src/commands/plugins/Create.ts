import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { PluginArguments, PluginMeta } from "../../types/types.js";
import { CustomError } from "../../lib/CustomError.js";
import { homedir, userInfo } from "os";
import { dump } from "js-yaml";

type CommandOptions = {
  name: string;
  script: string;
  tasks: boolean;
  config: string;
};

const meta: PluginMeta = {
  command: {
    name: "create",
    description: "Create new project structure in the current directory",
    aliases: [],
    argument: "name",
    options: [
      {
        flag: "-c, --config <template>",
        description: `Copy the content of a config template file to newly created folder`,
      },
      {
        flag: "-t, --tasks",
        description: "Create .vscode folder with pre-setup VSCods tasks",
        defaultValue: false,
      },
      {
        flag: "-s, --script <template>",
        description: `Copy the content of a template script file(s) to newly created "src" folder`,
      },
    ],
  },
  options: {
    requireConnection: false,
    requireEnv: false,
    requireApp: false,
  },
};

async function action(args: PluginArguments<CommandOptions>) {
  const print = new args.tools.print(false);

  const currentFolder = process.cwd();
  if (existsSync(`${currentFolder}/${args.command.argument}`))
    throw new CustomError(
      `${currentFolder}/${args.command.argument} folder already exists`,
      "error",
      true,
    );

  if (args.command.options.script) {
    if (
      !existsSync(
        `${homedir()}/qlBuilder_templates/script/${args.command.options.script}`,
      )
    )
      throw new CustomError(
        `Template "${args.command.options.script}" not found in ${homedir()}/qlBuilder_templates/script`,
        "error",
        true,
      );
  }

  if (args.command.options.config) {
    if (
      !existsSync(
        `${homedir()}/qlBuilder_templates/config/${args.command.options.config}.yml`,
      )
    )
      throw new CustomError(
        `Template "${args.command.options.config}" not found in ${homedir()}/qlBuilder_templates/config`,
        "error",
        true,
      );
  }

  createInitFolders(currentFolder, args.command.argument);

  if (args.command.options.script) {
    copyTemplateScripts(
      currentFolder,
      args.command.argument,
      args.command.options.script,
      args.tools.print,
      args.tools.build,
    );

    print.ok(
      `Script files created using template "${args.command.options.script}"`,
    );
  } else {
    createInitScriptFiles(
      currentFolder,
      args.command.argument,
      args.tools.build,
    );

    print.ok("Default script created");
  }

  if (args.command.options.config) {
    copyTemplateConfig(
      currentFolder,
      args.command.argument,
      args.command.options.config,
    );

    print.ok(
      `Config file created using template "${args.command.options.config}"`,
    );
  } else {
    createInitConfig(currentFolder, args.command.argument);
    print.ok("Default config file created");
  }

  createGitIgnore(currentFolder, args.command.argument);
  print.ok(".gitignore file create");
  createReadMe(currentFolder, args.command.argument);
  print.ok("README.md file create");

  // TODO: handle this with the template params?
  if (args.command.options.tasks) {
    createVSCodeTasks(currentFolder, args.command.argument);
    print.ok(".vscode/settings.json and .vscode/tasks.json files created");
  }

  print.ok("All set");
}

function createInitConfig(currentFolder, name) {
  const defaultConfig = [
    {
      name: "desktop",
      host: "localhost:4848",
      trustAllCerts: true,
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

  let yamlContent = dump(defaultConfig);
  yamlContent = `# yaml-language-server: $schema=https://github.com/Informatiqal/qlbuilder/blob/master/src/schema/config.json?raw=true

${yamlContent}`;

  writeFileSync(`${currentFolder}/${name}/config.yml`, yamlContent);
}

function createInitFolders(currentFolder, name) {
  mkdirSync(`${currentFolder}/${name}`);
  mkdirSync(`${currentFolder}/${name}/src`);
  mkdirSync(`${currentFolder}/${name}/dist`);
}

function createGitIgnore(currentFolder, name) {
  writeFileSync(`${currentFolder}/${name}/.gitignore`, "session.txt");
}

function createReadMe(currentFolder, name) {
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

## Credentials

All credentials are stored in user's folder inside \`.qlbuilder.yml\`. \`qlBuilder\` matches the name from \`config.yml\` with the name from \`.qlbuilder.yml\` to use the correct credentials.

## Usage

To view all commands just run \`qlbuilder\` command in the terminal/command prompt

## Issues and Questions

If you have any questions or issues then please open an [GitHub issue](https://github.com/Informatiqal/qlbuilder/issues)

## Funding

And if you find this project useful please consider donating to its development [Ko-Fi](https://ko-fi.com/stefanstoichev)

Thank you!
`;

  writeFileSync(`${currentFolder}/${name}/README.md`, readmeContent);
}

function createInitScriptFiles(currentFolder, name, build) {
  const rawScript = `SET ThousandSep=',';
SET DecimalSep='.';
SET MoneyThousandSep=',';
SET MoneyDecimalSep='.';
SET MoneyFormat='£#,##0.00;-£#,##0.00';
SET TimeFormat='hh:mm:ss';
SET DateFormat='DD/MM/YYYY';
SET TimestampFormat='DD/MM/YYYY hh:mm:ss[.fff]';
SET FirstWeekDay=0;
SET BrokenWeeks=0;
SET ReferenceDay=4;
SET FirstMonthOfYear=1;
SET CollationLocale='en-GB';
SET CreateSearchIndexOnReload=0;
SET MonthNames='Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec';
SET LongMonthNames='January;February;March;April;May;June;July;August;September;October;November;December';
SET DayNames='Mon;Tue;Wed;Thu;Fri;Sat;Sun';
SET LongDayNames='Monday;Tuesday;Wednesday;Thursday;Friday;Saturday;Sunday';
SET NumericalAbbreviation='3:k;6:M;9:G;12:T;15:P;18:E;21:Z;24:Y;-3:m;-6:μ;-9:n;-12:p;-15:f;-18:a;-21:z;-24:y';
`;

  writeFileSync(`${currentFolder}/${name}/src/1--Main.qvs`, rawScript);

  build(`${currentFolder}/${name}`, false);
  console.log("");
}

function copyTemplateScripts(
  currentFolder,
  name,
  templateScript,
  print,
  build,
) {
  const homeFolder = homedir();
  const templateFolder = `${homeFolder}/qlBuilder_templates/script/${templateScript}`;
  const templateFiles = readdirSync(templateFolder);

  if (templateFiles.length == 0) {
    createInitScriptFiles(currentFolder, name, build);

    print.warn(
      `Template folder "${templateScript}" was found but its empty. Initialized with the default script content`,
    );

    return;
  }

  const scriptFiles = templateFiles.filter(
    (f) => f.toLowerCase().split(".").pop() == "qvs",
  );

  for (let scriptFile of scriptFiles) {
    copyFileSync(
      `${templateFolder}/${scriptFile}`,
      `${currentFolder}/${name}/src/${scriptFile}`,
    );
  }

  build(`${currentFolder}/${name}`, false);
}

function copyTemplateConfig(currentFolder, name, templateConfigName) {
  const homeFolder = homedir();
  const templateFolder = `${homeFolder}/qlBuilder_templates/config`;
  copyFileSync(
    `${templateFolder}/${templateConfigName}.yml`,
    `${currentFolder}/${name}/config.yml`,
  );
}

function createVSCodeTasks(currentFolder, name) {
  const settings = JSON.stringify(
    {
      env: "environment name here",
    },
    null,
    4,
  );

  const tasks = JSON.stringify(
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
          detail: "Upload (set) the script to the Qlik app and reloads it",
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
        {
          label: "Credential environments",
          type: "shell",
          detail:
            "List the names and type of all saved credential environments (from .qlBuilder.yml)",
          command: "qlbuilder cred",
        },
      ],
    },
    null,
    4,
  );

  mkdirSync(`${currentFolder}/${name}/.vscode`);
  writeFileSync(`${currentFolder}/${name}/.vscode/tasks.json`, tasks);
  writeFileSync(`${currentFolder}/${name}/.vscode/settings.json`, settings);
}

export { meta, action };
