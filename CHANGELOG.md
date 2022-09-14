# Changelog

All notable changes to this project will be documented in this file.

## [2.2.4] - 2022-09-14

- new command `templates` - list the available script and config templates
  - `create` - optional sub-command that will create an empty templates folder structure
- new **optional** arguments for `create` command
  - `-s` or `--script` - the creation process will copy the script files from the specified template folder
  - `-c` or `--config` - the creation process will copy the template yml from the template folder as `config.yml` into the current folder

## [2.2.2] - 2022-09-13

- new set of commands:
  - `section add` - add new script section on a specific position
  - `section remove` - remove one or many script sections. Once the operation is completed the existing sections are re-numbered
  - `section move` - move script section
  - `section renumber` - re-number all script section so their names are continuous
- [fix] `setScript` saves the app at the end

## [2.1.0] - 2022-09-10

- new command `cred` - list the names of all saved credential environments (from `.qlBuilder.yml`)

## [2.0.0] - 2022-08-22

- codebase is TypeScript
- new command `download` - download the specified appid with or without data at user specified location
