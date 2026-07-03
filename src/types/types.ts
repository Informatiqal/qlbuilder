import { IConfig } from "../lib/Config.js";
import { Print } from "../lib/Print.js";
import { Spin } from "../lib/Spinner.js";
import { Build } from "../commands/temp/Build.js";
import { Auth } from "../lib/Auth.js";
import { Checks } from "../lib/Checks.js";
import { Engine } from "../lib/Engine.js";

export type DownloadOptionValues = {
  path: string;
  nodata?: "true" | "false";
  config: string;
};

export type GetScriptOptionValues = {
  debug?: string;
  y?: string;
  reloadOutput?: string;
  reloadOutputOverwrite?: string;
  config: string;
};

export type WatchOptionValues = {
  debug?: string;
  reload?: string;
  disable?: string;
  set?: string;
  config: string;
};

export type AppDetailsOptions = {
  debug?: string;
  output?: string;
  config: string;
};

export interface DownloadExportRequest {
  fileName: string;
  path: string;
}

export type AuthType = "saas" | "winform" | "desktop" | "jwt" | "certificates";

export interface WinFormCredentials {
  QLIK_USER: string;
  QLIK_PASSWORD: string;
}

export interface CertificatesCredentials {
  QLIK_CERTS: string;
  QLIK_USER: string;
}

export interface TokenCredentials {
  QLIK_TOKEN: string;
}

export interface RepoApp {
  id: string;
  createdDate: string;
  modifiedDate: string;
  modifiedByUserName: string;
  customProperties: {
    name?: string;
    id: string;
    createdDate: string;
    modifiedDate: string;
    modifiedByUserName: string;
    value: string;
    definition: {
      id: string;
      name: string;
      valueType: string;
      choiceValues: string[];
    };
    schemaPath: string;
  }[];
  owner: {
    id: string;
    userId: string;
    userDirectory: string;
    userDirectoryConnectorName: string;
    name: string;
  };
  name: string;
  appId: string;
  sourceAppId: string;
  targetAppId: string;
  publishTime: string;
  published: boolean;
  tags: {
    id: string;
    name: string;
  }[];
  description: "";
  stream: {
    id: string;
    name: string;
  };
  fileSize: number;
  lastReloadTime: string;
  thumbnail: string;
  savedInProductVersion: string;
  migrationHash: string;
  dynamicColor: string;
  availabilityStatus: number;
  lastDataDistribution: string;
  staticByteSize: number;
  schemaPath: string;
}

export interface TablesAndFieldsProcessed {
  [k: string]: {
    table: {
      rows: string;
      tags: string;
    };
    fields: {
      [k: string]: {
        keyType: string;
        rows: string;
        distinctValues: string;
        nonNulls: string;
        tags: string[];
      };
    };
  };
}

export interface Plugin {
  meta: PluginMeta;
  action(): string;
}

export interface PluginMeta {
  command: {
    name: string;
    description?: string;
    aliases?: string[];
    options?: {
      flag: string;
      description?: string;
      defaultValue?: string | string[] | boolean;
    }[];
  };
  options?: {
    requireConnection?: boolean;
    requireEnv?: boolean;
    requireApp?: boolean;
    configFile?: string;
  };
}

export interface PluginArgumentsEngine {
  global: AnyFunction;
  app: AnyFunction;
  session: AnyFunction;
  auth: Auth;
  enigmaInstance: typeof Engine;
}

export interface PluginArguments {
  environment: IConfig | undefined;
  command: {
    name: string | undefined;
    options: AnyObject;
  };
  engine:
    | PluginArgumentsEngine
    | {
        global: undefined;
        app: undefined;
        session: undefined;
        auth: Auth | undefined;
        enigmaInstance: typeof Engine;
      };
  tools: {
    build: typeof Build;
    spinner: typeof Spin;
    print: typeof Print;
    checks: typeof Checks;
  };
}

export interface PluginConfigFile {
  plugins: string[];
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type RequiredMeta = DeepRequired<PluginMeta>;

export interface AnyObject {
  [k: string]: string | number | boolean | Function;
}

export interface AnyFunction {
  [k: string]: Function;
}
