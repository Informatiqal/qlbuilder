export type DownloadOptionValues = {
  path: string;
  nodata?: "true" | "false";
};

export type GetScriptOptionValues = {
  debug?: string;
  y?: string;
  reloadOutput?: string;
  reloadOutputOverwrite?: string;
};

export type WatchOptionValues = {
  debug?: string;
  reload?: string;
  disable?: string;
  set?: string;
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
