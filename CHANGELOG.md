# Changelog

All notable changes to this project will be documented in this file.

## [2.8.3] - 2025-06-20

- dependency updates

## [2.8.2] - 2024-02-10

- updated initial script (`create` command) to be in sync with QS's initial script. At the moment the initial script is GB specific. Please use the template functionality to change the initial script for your region

## [2.8.1] - 2024-02-10

- printing the reload progress is now handled by [mGetReloadProgress (enigma-mixin)](https://github.com/countnazgul/enigma-mixin?tab=readme-ov-file#global)
- dependency updates

## [2.8.0] - 2024-02-04

- two new arguments for `reload` command
  - `-ro, --reload-output <LOCATION>` - after reload is complete (ok or with errors) the reload log is saved inside `<LOCATION>` folder
  - `-roo, --reload-output-overwrite <LOCATION>` - similar to the above command but the reload log will overwrite any existing reload log (for the same app)
- dependency updates

## [2.7.0] - 2024-01-20

- `download` command works with Qlik Cloud as well [#146](https://github.com/Informatiqal/qlbuilder/issues/146)
- dependency updates

## [2.6.0] - 2023-03-21

- dependency updates
- enigma schema is bundled in the release

## [2.5.3] - 2022-12-26

- dependency updates

## [2.5.2] - 2022-10-04

- [fix] missed typo that was leading to auth issue (again)

## [2.5.1] - 2022-10-03

- [fix] - re-appearance of an issue where the auth was stuck on QS Desktop

## [2.5.0] - 2022-10-02

- [add] [#61](https://github.com/Informatiqal/qlbuilder/issues/61) new command `appDetails` - display details for the configured app
  - id
  - name
  - size
  - published
    - stream id
    - stream name
    - publish time
  - created date
  - last modified date
  - last reload date
  - description

## [2.4.0] - 2022-10-02

- [add] [#60](https://github.com/Informatiqal/qlbuilder/issues/60) new command `createApp` - creates brand new app in the targeted environment. Once the app is created the `config.yml` is updated and the target environment appId is updated with the new app id.

## [2.3.1] - 2022-09-30

- [fix] [#59](https://github.com/Informatiqal/qlbuilder/issues/59) authentication method is called correctly

## [2.3.0] - 2022-09-30

- [add] [#48](https://github.com/Informatiqal/qlbuilder/issues/48) post install and uninstall scripts
  - post install will create templates folder and `qlBuilder.yml` file (populates with sample data)
  - uninstall will delete `qlBuilder.yml` file only! Templates folder will be left.

## [2.2.6] - 2022-09-30

- [fix] [#55](https://github.com/Informatiqal/qlbuilder/issues/55) additional check if the auth method in `config.yml` is a valid method name.
  - for QS Desktop not auth method is required. If the url have `:4848` all auth checks are skipped
- [fix] [#54](https://github.com/Informatiqal/qlbuilder/issues/54) Qlik comm errors for `getScript` are now captured. eg section access `Access denied`

## [2.2.4] - 2022-09-14

- [add] [#49](https://github.com/Informatiqal/qlbuilder/issues/49) new command `templates` - list the available script and config templates
  - `create` - optional sub-command that will create an empty templates folder structure
- [add] [#38](https://github.com/Informatiqal/qlbuilder/issues/38) new **optional** arguments for `create` command
  - `-s` or `--script` - the creation process will copy the script files from the specified template folder
  - `-c` or `--config` - the creation process will copy the template yml from the template folder as `config.yml` into the current folder

## [2.2.2] - 2022-09-13

- [add] [#40](https://github.com/Informatiqal/qlbuilder/issues/40) new set of commands:
  - `section add` - add new script section on a specific position
  - `section remove` - remove one or many script sections. Once the operation is completed the existing sections are re-numbered
  - `section move` - move script section
  - `section renumber` - re-number all script section so their names are continuous
- [fix] `setScript` saves the app at the end

## [2.1.0] - 2022-09-10

- [add] [#39](https://github.com/Informatiqal/qlbuilder/issues/39) new command `cred` - list the names of all saved credential environments (from `.qlBuilder.yml`)

## [2.0.0] - 2022-08-22

- codebase is TypeScript
- new command `download` - download the specified appid with or without data at user specified location
