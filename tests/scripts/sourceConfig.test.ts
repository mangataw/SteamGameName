import { describe, expect, it } from "vitest";
import { renderSourceConfig } from "../../scripts/source-config";

describe("release source config", () => {
  it("keeps local builds offline", () => {
    expect(renderSourceConfig({ version: "1.0.0-rc.1" })).toContain("remote_url = nil");
  });

  it("tracks the controlled main catalog in release builds", () => {
    const content = renderSourceConfig({
      repository: "mangataw/SteamGameName",
      catalogRef: "main",
      version: "1.0.0-rc.1",
    });

    expect(content).toContain("https://raw.githubusercontent.com/mangataw/SteamGameName/main/data/translations.zh-CN.json");
  });

  it("rejects arbitrary catalog references", () => {
    expect(() => renderSourceConfig({
      repository: "mangataw/SteamGameName",
      catalogRef: "feature/unreviewed-catalog",
      version: "1.0.0-rc.1",
    })).toThrow("CATALOG_REF must be main");
  });

  it("requires the repository and catalog ref together", () => {
    expect(() => renderSourceConfig({
      repository: "mangataw/SteamGameName",
      version: "1.0.0-rc.1",
    })).toThrow("must be provided together");
  });
});
