import { load as yamlLoad } from "js-yaml";
import { configDecryptedOrNot, decryptConfig } from "./Decrypt";

export class CredentialEnvironments {
  constructor() {}

  async run(): Promise<{ name: string; type: string }[]> {
    const configContent = await configDecryptedOrNot();

    try {
      const credentials: { [k: string]: any } = yamlLoad(configContent) as {
        [k: string]: any;
      };

      if (Object.entries(credentials).length == 0)
        throw new Error("No credentials environments are setup");

      const environmentNames = Object.entries(credentials).map((c) => {
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

      return environmentNames;
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
