import { Command } from "commander";
import {
  AnyObject,
  DeepRequired,
  Plugin,
  PluginConfigFile,
  PluginMeta,
  RequiredMeta,
} from "../../types/types.js";
import { pluginActionWrapper } from "./actionWrapper.js";
import { load } from "js-yaml";
import { existsSync, readFileSync } from "fs";

async function getPluginsList(): Promise<string[]> {
  const pluginsList = load(
    readFileSync("c:/users/countnazgul/qlbuilder/plugins.yaml", "utf-8"),
  ) as PluginConfigFile;

  return pluginsList.plugins;
}

export async function loadExternalPlugins() {
  const pluginsList = await getPluginsList();

  const defaultMeta: RequiredMeta = {
    command: {
      name: "",
      description: "",
      aliases: [],
      options: [],
    },
    options: {
      requireConnection: true,
      requireEnv: true,
      configFile: "config.yml",
    },
  };

  const commands = await Promise.all(
    pluginsList.map(async (pluginPath) => {
      if (!existsSync(pluginPath))
        throw new Error(
          `External plugin is missing. Fix the part or remove the reference. Tried to load "${pluginPath}"}`,
        );

      const plugin: Plugin = await import(`file:///${pluginPath}`);
      const o = { ...defaultMeta } as RequiredMeta;
      o.command = { ...o.command, ...plugin.meta.command };
      o.options = { ...o.options, ...plugin.meta.options };

      if (!plugin.meta)
        throw new Error(
          `External plugin is missing meta section. Loaded from "${pluginPath}"}`,
        );

      // force to require environment when connection is needed
      if (o.options.requireConnection == true && o.options.requireEnv == false)
        o.options.requireEnv = true;

      if (!plugin.action)
        throw new Error(
          `External plugin is missing an action function. Loaded from "${pluginPath}"}`,
        );

      if (!plugin.meta.command.name)
        throw new Error(
          `command.name property is mandatory for a plugin. Loaded from "${pluginPath}"}`,
        );

      const comm = new Command(plugin.meta.command.name);
      comm.description(o.command.description as string);

      o.command.options.map((option) => {
        if (option.defaultValue) {
          comm.option(
            option.flag,
            option.description || "",
            option.defaultValue,
          );
        } else {
          comm.option(option.flag, option.description || "");
        }
      });

      comm.option(
        "-d, --debug",
        "Debug. Write out enigma traffic messages",
        "false",
      );

      o.command.aliases.map((al) => {
        comm.alias(al);
      });

      if (o.options.requireEnv) {
        comm.argument("<env>");
        comm.action(async function (name: string, options: AnyObject) {
          const n = name;
          const o1 = options;

          await pluginActionWrapper(comm, o, plugin.action, n, o1);
        });
      } else {
        comm.action(async function (options: AnyObject) {
          const o1 = options;

          await pluginActionWrapper(comm, o, plugin.action, undefined, o1);
        });
      }

      return comm;
    }),
  );

  return commands;
}
