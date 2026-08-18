import { PluginArguments, PluginMeta } from "../../types/types.js";
import { getConfigContent } from "./Decrypt.js";

type CommandOptions = {};

const meta: PluginMeta = {
  command: {
    name: "cred",
    description: "List the name and type of all saved credential environments",
    aliases: [],
    argument: "",
    options: [
      {
        flag: "-c, --config [config_file_name]",
        description:
          "Optional. Name of the config file to use. The file sill have to be in the current folder",
        defaultValue: "config.yml",
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
  const { parsedContent } = await getConfigContent();

  if (Object.entries(parsedContent).length == 0)
    throw new Error("No credentials environments are setup");

  const environmentNames = Object.entries(parsedContent).map((c) => {
    let envType = "";

    if (
      !c[1] ||
      (!c[1]["QLIK_CERTS"] &&
        !c[1]["QLIK_USER"] &&
        !c[1]["QLIK_PASSWORD"] &&
        !c[1]["QLIK_TOKEN"])
    )
      return {
        name: `${c[0]}`,
        type: `Warning: Type cannot be defined! Please fix.`,
      };

    if (c[1]["QLIK_CERTS"]) envType = "(certificates)";
    if (c[1]["QLIK_USER"] && c[1]["QLIK_PASSWORD"]) envType = "(win/form)";
    if (c[1]["QLIK_TOKEN"]) envType = "(jwt/saas)";

    return { name: `${c[0]}`, type: `${envType}` };
  });

  console.table(environmentNames);
}

export { meta, action };
