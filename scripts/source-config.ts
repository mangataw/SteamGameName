export interface SourceConfigOptions {
  repository?: string;
  commitSha?: string;
  version: string;
}

export function renderSourceConfig({ repository, commitSha, version }: SourceConfigOptions): string {
  if (Boolean(repository) !== Boolean(commitSha)) {
    throw new Error("GITHUB_REPOSITORY and GITHUB_SHA must be provided together");
  }
  if (repository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);
  }
  if (commitSha && !/^[0-9a-f]{40}$/i.test(commitSha)) {
    throw new Error("GITHUB_SHA must be a full 40-character commit SHA");
  }

  const remoteUrl = repository && commitSha
    ? `https://raw.githubusercontent.com/${repository}/${commitSha}/data/translations.zh-CN.json`
    : null;
  return `-- Generated; do not edit in release artifacts.\nreturn {\n    remote_url = ${remoteUrl ? JSON.stringify(remoteUrl) : "nil"},\n    version = ${JSON.stringify(version)}\n}\n`;
}
