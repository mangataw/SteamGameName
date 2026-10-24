export interface SourceConfigOptions {
  repository?: string;
  catalogRef?: string;
  version: string;
}

export function renderSourceConfig({ repository, catalogRef, version }: SourceConfigOptions): string {
  if (Boolean(repository) !== Boolean(catalogRef)) {
    throw new Error("GITHUB_REPOSITORY and CATALOG_REF must be provided together");
  }
  if (repository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);
  }
  if (catalogRef && catalogRef !== "main") {
    throw new Error("CATALOG_REF must be main");
  }

  const remoteUrl = repository && catalogRef
    ? `https://raw.githubusercontent.com/${repository}/${catalogRef}/data/translations.zh-CN.json`
    : null;
  return `-- Generated; do not edit in release artifacts.\nreturn {\n    remote_url = ${remoteUrl ? JSON.stringify(remoteUrl) : "nil"},\n    version = ${JSON.stringify(version)}\n}\n`;
}
