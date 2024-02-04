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
