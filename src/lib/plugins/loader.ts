import { homedir } from "os";
import { Command } from "commander";
import {
    AnyObject,
    Plugin,
    PluginConfigFile,
    PluginMeta,
    RequiredMeta,
} from "../../types/types.js";
import { pluginActionWrapper } from "./actionWrapper.js";
import { load } from "js-yaml";
import { existsSync, readFileSync } from "fs";
import { Print } from "../Print.js";
import {
    AppDetails,
    Build,
    CheckScript,
    GetScript,
    SetScript,
    Reload,
    Watch,
    TablesAndFields,
    Encrypt,
    Decrypt,
    Create,
    Download,
    Section,
    VScode,
    ListTemplates,
    ListCredentials,
} from "../../commands/plugins/index.js";

const print = new Print();
const defaultMeta: RequiredMeta = {
    command: {
        name: "",
        description: "",
        aliases: [],
        options: [],
        argument: "",
    },
    subCommands: [],
    options: {
        requireConnection: true,
        requireEnv: true,
        requireApp: true,
        configFile: "config.yml",
    },
};

async function getPluginsList(): Promise<string[]> {
    const pluginsConfigPath = `${homedir}/qlbuilder/plugins.yaml`;

    if (existsSync(pluginsConfigPath)) {
        const pluginsList = load(
            readFileSync(pluginsConfigPath, "utf-8"),
        ) as PluginConfigFile;

        return pluginsList.plugins || [];
    }

    return [];
}

function generateCommand(plugin: Plugin) {
    const o = { ...defaultMeta } as RequiredMeta;
    o.command = { ...o.command, ...plugin.meta.command };
    o.options = { ...o.options, ...plugin.meta.options };

    if (o.options.requireConnection == true && o.options.requireEnv == false)
        o.options.requireEnv = true;

    const comm = new Command(plugin.meta.command.name);
    comm.description(`${o.command.description}`);

    if (!plugin.action) {
        plugin["action"] = async function () {
            comm.help();
        };
    }

    o.command.options.map((option) => {
        if (option.hasOwnProperty("defaultValue")) {
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

    // add command aliases (if any)
    o.command.aliases.map((al) => {
        comm.alias(al);
    });

    if (o.options.requireEnv) {
        comm.argument("<env>");
        comm.action(async function (name: string, options: AnyObject) {
            const n = name;
            const o1 = options;

            await pluginActionWrapper(o, plugin.action, n, o1);
            return;
        });
    } else {
        if (o.command.argument.length > 0) {
            comm.argument(`<${o.command.argument}>`);
            comm.action(async function (name: string, options: AnyObject) {
                const n = name;
                const o1 = options;

                await pluginActionWrapper(o, plugin.action, n, o1);
            });
        } else {
            comm.action(async function (options: AnyObject) {
                const o1 = options;
                await pluginActionWrapper(o, plugin.action, undefined, o1);
            });
        }
    }

    return comm;
}

export async function loadExternalPlugins() {
    const pluginsList = await getPluginsList();

    const commands = await Promise.all(
        pluginsList.map(async (pluginPath) => loadExternalPlugin(pluginPath)),
    );

    return commands;
}

async function loadExternalPlugin(pluginPath: string) {
    if (!existsSync(pluginPath)) {
        print.error(
            `External plugin is missing. Fix the part or remove the reference. Tried to load "${pluginPath}"`,
        );

        process.exit(1);
    }

    const pluginModule: Plugin = await import(`file:///${pluginPath}`);
    // cloning so it can be edited - adding placeholder action if action is missing/not exported
    const plugin = { ...pluginModule };

    if (!plugin.meta) {
        print.error(
            `External plugin is missing meta section. Loaded from "${pluginPath}"`,
        );
        process.exit(1);
    }

    const o = { ...defaultMeta } as RequiredMeta;
    o.command = { ...o.command, ...plugin.meta.command };
    o.options = { ...o.options, ...plugin.meta.options };

    // force to require environment when connection is needed
    if (o.options.requireConnection == true && o.options.requireEnv == false)
        o.options.requireEnv = true;

    if (!plugin.meta.command.name) {
        print.error(
            `command.name property is mandatory for a plugin. Loaded from "${pluginPath}"`,
        );

        process.exit(1);
    }

    if (plugin.meta.subCommands && plugin.meta.subCommands.length > 0) {
        let b = {};

        plugin.meta.command.description = `(External plugin) ${plugin.meta.command.description}`;
        const command = generateCommand(plugin);
        b[plugin.meta.command.name] = { children: [], command };

        for (const subCommand of plugin.meta.subCommands) {
            const command = generateCommand(subCommand);
            b[subCommand.meta.command.name] = { children: [], command };
            walkBottomUp(subCommand, plugin);
        }

        function walkBottomUp(node: Plugin, parent?: Plugin) {
            const children = node.meta.subCommands ?? [];

            for (const child of children) {
                walkBottomUp(child, node);
            }

            const current = node?.meta?.command.name ?? "(no name)";
            const parentName = parent ? parent.meta.command.name : "";
            const command = generateCommand(node);
            b[current] = {
                parent: parentName,
                current,
                children: [],
                meta: node.meta,
                command,
            };
        }

        for (let p of Object.keys(b)) {
            if (b[p].parent) {
                b[b[p].parent].command.addCommand(b[p].command);
            }
        }
        return b[plugin.meta.command.name].command;
    } else {
        const command = generateCommand(plugin);
        return command;
    }
}

export async function loadInternalPlugins() {
    const code = {
        build: Build,
        create: Create,
        download: Download,
        getScript: GetScript,
        checkScript: CheckScript,
        setScript: SetScript,
        vsCode: VScode,
        reload: Reload,
        watch: Watch,
        credentialEnvironments: ListCredentials,
        sectionOperations: Section,
        // createApp: CreateApp,
        encrypt: Encrypt,
        decrypt: Decrypt,
        tablesAndFields: TablesAndFields,
        appDetails: AppDetails,
        templates: ListTemplates,
    };

    const commands: Command[] = [];

    Object.keys(code).map((p) => {
        const command = loadInternalPlugin(code[p].meta, code[p].action);
        commands.push(command);
    });

    return commands;
}

function loadInternalPlugin(meta: PluginMeta, action: any) {
    const plugin = { meta, action };
    const command = generateCommand(plugin);

    return command;
}
