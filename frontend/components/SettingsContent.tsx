import { DialogButton, DialogControlsSection, Field } from "millennium";
import { useEffect, useState, useSyncExternalStore } from "react";
import { translationStore } from "../services/translationStore";
import type { DisplayMode } from "../types/settings";

const modeLabels: Record<DisplayMode, string> = {
  bilingual: "中文名 | 原名",
  chinese: "仅中文名",
  original: "仅原名",
};

function timeText(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "暂无";
}

export function SettingsContent() {
  const snapshot = useSyncExternalStore(translationStore.subscribe, translationStore.getSnapshot, translationStore.getSnapshot);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void translationStore.initialize().catch((reason: unknown) => setError(String(reason))); }, []);

  async function changeMode(mode: DisplayMode) {
    setError(null);
    try { await translationStore.setMode(mode); } catch (reason) { setError(String(reason)); }
  }

  async function refresh() {
    setBusy(true);
    setError(null);
    try { await translationStore.refresh(); } catch (reason) { setError(String(reason)); } finally { setBusy(false); }
  }

  const { status } = snapshot;
  const etag = status.etag ? status.etag.replace(/^W\//, "").replaceAll('"', "").slice(0, 10) : "无";
  return (
    <DialogControlsSection>
      <Field label="显示模式" description="只影响游戏库左侧列表中的官方 Steam 游戏名称。">
        <select
          aria-label="显示模式"
          value={snapshot.settings.displayMode}
          onChange={(event) => void changeMode(event.currentTarget.value as DisplayMode)}
        >
          {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field label={`词库状态：${status.state}`} description={`来源 ${status.source} · ${status.entryCount} 条 · ETag ${etag}`} />
      <Field label="最后成功更新" description={timeText(status.lastModified ?? status.lastSuccessfulUpdateAt)} />
      <Field label="上次检查" description={timeText(status.lastCheckedAt)} />
      {!status.patchCompatible && <Field label="兼容性提示" description="当前 Steam 客户端左栏结构暂不兼容，插件已安全停用名称补丁。" />}
      {(error ?? status.error) && <Field label="最近错误" description={error ?? status.error ?? ""} />}
      <DialogButton disabled={busy} onClick={() => void refresh()}>{busy ? "正在刷新…" : "立即刷新词库"}</DialogButton>
    </DialogControlsSection>
  );
}

