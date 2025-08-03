# qlBuilder

## Motivation

`qlbuilder` is a CLI tool which is ran from the command prompt. The tool allows Qlik Sense developers to write their Qlik scripts locally and to communicate with Qlik instance to:

- set the reload script into configured Qlik app
- reload app (the reload is performed from Qlik instance itself)
- check for syntax errors while developing without the need to save the whole app (the syntax check is performed against temporary session app)
- download Qlik app(s) with or without data

## Installation

> npm install -g qlbuilder

Once the global package is installed you can use `qlbuilder` command from any folder

## How to use?

(To list all commands run `qlbuilder --help`)

Run one of the following commands from CMD/PowerShell

- `qlbuilder create [name]` - create the initial folders and files in the current folder. `name` is used as root folder name

  - `-t --task` (optional) - supplying this argument will create `VSCode` specific files inside `.vscode` folder as well. The `tasks.json` file describe all tasks that can be ran with `qlbuilder`. Change the environment name in `settings.json` file and use `VSCode` to start the tasks. (`tasks.json` can be left as it is. No need for editing there)
  - `-s --script` (optional) - the creation process will copy the script files from the specified template folder [using Templates](#templates)
  - `-c --config` (optional) - the creation process will copy the template yml from the template folder as `config.yml` into the current folder [using Templates](#templates)

- `qlbuilder build`

  - builds the full load script from `/src/*.qvs` files. The produced script is saved in `dist` folder (`LoadScript.qvs`)

- `qlbuilder checkscript [env]`

  - builds the script (from `/src/*.qvs` files)
  - connects to Qlik and checks the script for syntax errors - `env` is the environment name from `config.yml`. The check is performed against temporary session app.

- `qlbuilder reload [env]`

  - connects to Qlik and reload the app - `env` is the environment name from `config.yml`. Once the reload has started `qlbuilder` will display the progress in the same console.
  - `-ro, --reload-output <LOCATION>` - after the app is reload (with or without errors) the reload log will be saved in `<LOCATION>` folder. The reload log file name will be in `appId_timestamp.txt` format.
  - `-roo, --reload-output-overwrite <LOCATION>` - similar functionality to `--reload-output` but the file name will be `appId.txt`. With this option only the last reload log will be kept.

- `qlbuilder setscript [env]`

  - builds the script (from `/src/*.qvs` files)
  - connects to Qlik and checks the script for syntax errors - `env` is the environment name from `config.yml`
  - sets the new script
  - saves the app

- `qlbuilder getscript [env]` - (the opposite of `setscript`) get the remote script, splits it into tabs and save the files inside `scr` folder. `config.yml` should present to indicate from which env/app to extract the script

  - `-y` - optional flag. The `getscript` command will always ask for confirmation before overwrite the files into `src` folder. Passing `-y` will skip this confirmation and will directly execute `getscript` command.

  Steps:

  - connects to Qlik and get the script from desired app - `env` is the environment name from `config.yml`
  - split the script into tabs/files
  - saves the `qvs` files into `src` folder

- `qlbuilder watch [env]` - enters in watch mode. The default behavior is to build and check the script syntax on any `*.qvs` file inside `src` folder. Can accept three additional flags:

  - `-r` - reloads the script on any `qvs` file change
  - `-s` - sets the script (and save the app) on any `qvs` file change
  - `-d` - disable the auto check for syntax errors. By default the script will check for syntax errors on each save (connects to QS and checks the script for errors against session/temp app)

  Inside `watch` mode the console is active and the developer can perform additional actions. Just type one of the letters/commands below in the console to trigger them:

  - `s` or `set` - build, syntax check and set script
  - `r` or `rl` - build and set the script, reload the app and save. If any syntax error (during the build and set) the reload is not triggered
  - `c` or `clr` - clear console
  - `e` or `err` - check for syntax errors (**useful only if the watch mode is started with `-d` argument**)
  - `?` - print these commands
  - `x` - exit

- `qlBuilder section [sub-command]` - main commands for **interactive** section operations

  - `add` - adds new script section at specified position
  - `remove` - remove one or many script sections. Once the sections/files are removed the rest of the files are re-numbered (see `renumber` operation)
  - `move` - move specific script section up/down. After the file is moved (in reality the file is actually renamed) the files are re-numbered
  - `renumber` - ideally all files are prefixed with an index (`1--`, `2--`, `3--` etc.) if section/file is deleted/renamed manually this index can appear "broken". Executing `renumber` command will re-index the files so the prefix will be continous

- `qlbuilder download [env]` - download the specified Qlik app. Optional parameter to include or exclude the data in the exported app/file

  - `-p` or `--path` (**mandatory**) - path to the folder where the qvf will be downloaded
  - `-nd` or `--nodata` - optional parameter indicating if the exported app should include the data or not. Default is `true`

- `qlbuilder templates` - list all available script and config templates
  `-c --create` (optional) - creates empty templates folder structure (if it doesn't exists) [using Templates](#templates)

- `qlbuilder vscode` - creates the `.vscode` folder (inside the current folder) with the `tasks.json` and `settings.json` files. Please check the `create` command description above for more info

- `qlBuilder appDetails [env]` - display info about the configured app

- `qlBuilder createApp [env]` - creates brand new (empty) app on the specified environment. Updates `config.yml` appId for the environment
- `qlBuilder encrypt` - encrypts `C:\Users\<USERNAME>\.qlBuilder.yml` file with user provided password
- `qlBuilder decrypt` - decrypts `C:\Users\<USERNAME>\.qlBuilder.yml` file with the user provided password used in `encrypt` command

## config.yml

The `create` command will create few folders and `config.yml` file. The config file is pre-populated with example values. This file specifies Qlik environments (dev, test, prod etc.)

The config file is in `yaml` format. The config below defines one environment (`desktop`) and the connection to it is made on `localhost:4848` and the app that we will target there is `qlbuilder Test.qvf`

```yaml
- name: desktop
  host: localhost:4848
  secure: false
  appId: C:\Users\MyUserName\Documents\Qlik\Sense\Apps\qlbuilder Test.qvf
```

(Take a look at the example above for how to specify `otherApps`. Used for setting the same script to additional apps)

For `QSE` with certificates the config will be:

```yaml
- name: prod
  host: 192.168.0.100:4747 # IP/FQDN of QS engine (central node)
  appId: 12345678-1234-1234-1234-12345678901 # app ID
  authentication:
    type: certificates
```

For `QSE` with `JWT` the config will be:

```yaml
- name: jwt
  host: 192.168.0.100/virtual-proxy-prefix # IP/FQDN with of the virtual proxy (see below)
  appId: 12345678-1234-1234-1234-12345678901a # app ID
  authentication:
    type: jwt
    sessionHeaderName: X-Qlik-Session-jwt # (optional) see below
```

When working with `jwt` port is not required. If `JWТ` is not the main method for authentication then the Virtual Proxy prefix need to be provided. For more information how to set this please check this  
[Qlik Support article](https://support.qlik.com/articles/000034966)

For `QSE` with Windows/Form the config will be:

```yaml
- name: uat
  host: 192.168.0.100/virtual-proxy-prefix # IP/FQDN with of the virtual proxy (if needed)
  appId: 12345678-1234-1234-1234-12345678901a # app ID
  authentication:
    type: winform
    sessionHeaderName: X-Qlik-Session-Win # (optional) see below
```

For `Qlik Saas` with Windows/Form the config will be:

```yaml
- name: saas
  host: tenant-name.eu.qlikcloud.com
  appId: 12345678-1234-1234-1234-12345678901a # app ID
  authentication:
    type: saas
```

By default `qlbuilder` will try and connect through `https`/`wss`. If the environment is QS Desktop or the communication is done via `http`/`ws` then `secure: false` need to be added to the environment configuration

`sessionHeaderName` - each Virtual Proxy should have a unique session cookie header name. The default value is `X-Qlik-Session`. If the default VP is used then this config value is not needed. `qlBuilder` will show warning message and will try to connect to Qlik with the default value.

## Environment variables and home config

For security reasons (mainly to avoid commit users and password) `qlbuilder` expects some environment variables to be set before start. The content of the variables can be pre-set using `.qlbuilder.yml` config file in the user home folder (see below)

### Environment variables

- `Windows`

  - `QLIK_USER` - in format DOMAIN\username
  - `QLIK_PASSWORD`

  > To set env variables:
  >
  > - in CMD - `set QLIK_USER=DOMAIN\UserName`
  > - in PowerShell - `$env:QLIK_PASSWORD="my_password"`

- `JWT` requires one environment variable to be set
  - `QLIK_TOKEN` - the content of the jwt token
- `Cert`
  - `QLIK_CERTS`- the folder location where the certificates are stored. The script will search for 3 certificates - `root.pem`, `client_key.pem` and `client.pem`
  - `QLIK_USER` - username in format `DOMAIN\UserName`
- `Saas`
  - `QLIK_TOKEN` - the API key, generated from the user settings panel

### Home config

`.qlbuilder.yml` config file - this file should be placed in your home folder (`c:\users\my-username`). The file contains the credentials for the Qlik environments. The name of the environments should match the ones in the local `config.yml`

```yml
dev:
  QLIK_USER: DOMAIN\my-dev-user
  QLIK_PASSWORD: my-dev-password
prod:
  QLIK_USER: DOMAIN\my-prod-user
  QLIK_PASSWORD: my-prod-password
dev_jwt:
  QLIK_TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiw...
prod_cert:
  QLIK_CERTS: c:\path\to\cert\folder
  QLIK_USER: DOMAIN\UserName
```

The environment name is used as an command argument (so try not to have spaces in the environment names)

## Naming script files

At the moment (it will probably change in near future) the script is build by reading the `qvs` files in `src` folder by alphabetical order. The files should have the following naming convention:

> number--name.qvs

To ensure alphabetical order the files should start with number followed by separator (`--`) and name. The name will be used as a tab name when setting the script in Qlik.

For example having the following files:

```text
1--Variables.qvs
2--DBLoad.qvs
3--Transformation.qvs
4--StoreData.qvs
5--DropTables
```

Will result in the following tabs in Qlik

![Tab View](https://github.com/informatiqal/qlbuilder/blob/master/images/tab_names.png?raw=true)

## Extra

Having the script files as local files allows to put them in version control. This will put the `src`, `dist` and `config.yml` files in the repository.

In some cases the Prod environment app can be without the original (full) script and just includes (via REST API call) the final load script (the one in `dist` folder) from Git's master branch. This way, technically, there is no need to touch the `Prod` app in case of an script change ... this is just an idea how to benefit from this approach.

## Templates

New projects can be initialized with predefined scripts and/or configs. In order to do this `qlBuilder` will search for templates in `C:\<USER>\qlbuilder_templates` folder. By default this folder (and its sub-folders) do not exists and can be created either manually or with:

```shell
qlBuilder templates create
```

There are two types of templates - config and script. Check the sections below for more information. Both Script and config template arguments are optional and if used can be provided independently to each other or both at the same time.

### Config

Under `qlbuilder_templates` folder create a folder named `config`. The `config` folder is where the config templates will be stored. Each template config should be valid `qlBuilder` config (`yml` file). There are no limitations on what the template file name should be (as long as is a valid file name).

For example: if there are 3 config template files: `dev_config.yml`, `uat_config.yml` and `test.yml`. Each template can be invoked with the following commands:

```shell
qlBuilder create my-project-name -c dev_config
```

```shell
qlBuilder create my-project-name -c uat_config
```

```shell
qlBuilder create my-project-name -c test
```

As seen when specifying config in the command the file extension (`.yml`) is omitted.

> **Note**
> Only files with `yml` extension are valid config templates

## Script

Under `qlbuilder_templates` folder create a folder named `script`. This folder will contain the folders with the script templates. Each template folder will contain the `qvs` script files that will be copied across when `create` command is used (if `-s` argument is provided). The script files should be prefixed (`1--xxx`, `2-xxx`, `3--xxx` etc).

For example: if there are 3 config template folders: `dev-env`, `uat-env` and `test`. Each template can be invoked with the following commands:

```shell
qlBuilder create my-project-name -s dev_env
```

```shell
qlBuilder create my-project-name -s uat_env
```

```shell
qlBuilder create my-project-name -s test
```

## Encrypt/Decrypt

The home folder config is not encrypted by default and its not necessary to be encrypted. But if there is a need to be encrypted then `qlBuilder encrypt` command can be used. Once encrypted the file cannot be modified until `qlBuilder decrypt` command is ran. Both commands will ask for a user specified password.

If the home config is encrypted then any command that require the file will first ask for the decrypt key before its ran.

> **Note**
> Only files with `qvs` extension will be copied to the result folder

## Roadmap

Have a look at the issues labeled as an [enhancement](https://github.com/Informatiqal/qlbuilder/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

---

If you have any issues, comments, suggestions etc please use the [GitHub issue tracker](https://github.com/informatiqal/qlbuilder/issues)
