import { definePlugin } from "millennium";
import { createElement } from "react";
import { SettingsContent } from "./components/SettingsContent";
import { TranslatedGameName } from "./components/TranslatedGameName";
import { translationStore } from "./services/translationStore";
import { formatDisplayName } from "./translation/formatDisplayName";

/** @ffi */
export const gameNames = {
  format(appId: number | string, originalName: string) {
    const snapshot = translationStore.getSnapshot();
    if (snapshot.version === 0) return null;
    return formatDisplayName(appId, originalName, snapshot.catalog, snapshot.settings.displayMode);
  },
  render(appId: number | string, originalName: string) {
    return createElement(TranslatedGameName, { appId, originalName });
  },
};

/** @ffi */
export function catalogUpdated(): boolean {
  void translationStore.reload().catch((error: unknown) => console.error("Failed to reload catalog", error));
  return true;
}

export default definePlugin(() => {
  void translationStore.initialize().catch((error: unknown) => console.error("Failed to initialize Steam game translations", error));
  return { title: "Steam 游戏名中文化", icon: <span>中</span>, content: <SettingsContent /> };
});
