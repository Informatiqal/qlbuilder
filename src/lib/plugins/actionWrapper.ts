import { CustomError } from "../../lib/CustomError.js";
import { AnyObject, PluginArguments, RequiredMeta } from "../../types/types.js";
import { Build } from "../../commands/temp/Build.js";
import { Spin } from "../../lib/Spinner.js";
import { Print } from "../Print.js";
import { Config, IConfig } from "../Config.js";
import { Auth } from "../Auth.js";
import { Engine } from "../Engine.js";
import { Checks } from "../Checks.js";

export async function pluginActionWrapper(
  meta: RequiredMeta,
  action,
  name: string | undefined,
  options: AnyObject,
) {
  const config = name
    ? new Config(name, `${meta.options.configFile}`).envDetails
    : undefined;

  const pluginArguments: PluginArguments = {
    environment: config,
    command: {
      name,
      options,
    },
    engine: {
      global: undefined,
      app: undefined,
      session: undefined,
      auth: undefined,
      enigmaInstance: Engine,
    },
    tools: {
      build: Build,
      spinner: Spin,
      print: Print,
      checks: Checks,
    },
  };

  if (meta.options.requireConnection == true && config) {
    const c = config as IConfig;
    const authInstance = new Auth(c);
    const auth = authMethod(c, authInstance);
    await auth();

    pluginArguments.engine.auth = authInstance;
    const qlik = new Engine(
      config.engineHost,
      config.appId,
      authInstance.data.headers,
      config.name,
      options.debug,
    );

    const session = qlik.session;
    const global = await qlik.session.open();

    let app = undefined;
    if (meta.options.requireApp) app = await global.openDoc(c.appId);

    pluginArguments.engine.session = session;
    pluginArguments.engine.global = global;
    pluginArguments.engine.app = app;
  }

  await action(pluginArguments);

  // try {
  //   if (pluginArguments.engine.session)
  //     //@ts-ignore
  //     await pluginArguments.engine.session.close().catch((e) => {});
  // } catch (e) {}
}

function authMethod(config: IConfig, auth: Auth) {
  if (config.host.indexOf(":4848") > -1) return auth.desktop;

  if (!auth[config.authentication.type])
    throw new CustomError(
      `Invalid authentication method - ${config.authentication.type}`,
      "error",
      true,
    );

  return () => auth[config.authentication.type]();
}
