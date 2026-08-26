import { describe, expect, it } from "vitest";
import { renderSourceConfig } from "../../scripts/source-config";

describe("release source config", () => {
  it("keeps local builds offline", () => {
    expect(renderSourceConfig({ version: "1.0.0-rc.1" })).toContain("remote_url = nil");
  });

  it("pins release catalogs to the full release commit", () => {
    const sha = "0123456789abcdef0123456789abcdef01234567";
    const content = renderSourceConfig({
      repository: "mangataw/SteamGameName",
      commitSha: sha,
      version: "1.0.0-rc.1",
    });

    expect(content).toContain(`https://raw.githubusercontent.com/mangataw/SteamGameName/${sha}/data/translations.zh-CN.json`);
    expect(content).not.toContain("/main/");
  });

  it("rejects mutable or abbreviated release references", () => {
    expect(() => renderSourceConfig({
      repository: "mangataw/SteamGameName",
      commitSha: "main",
      version: "1.0.0-rc.1",
    })).toThrow("full 40-character commit SHA");
  });
});
