import { DialogButton, DialogControlsSection, Dropdown, Field } from "millennium";
import { useState, useSyncExternalStore } from "react";
import { translationStore } from "../services/translationStore";
import type { DisplayMode } from "../types/settings";

const modeOptions = [
  { data: "bilingual" satisfies DisplayMode, label: "双语" },
  { data: "chinese" satisfies DisplayMode, label: "仅中文名" },
];

const stateLabels = {
  bundled: "内置",
  cached: "缓存",
  latest: "最新",
  offline: "离线",
  error: "错误",
} as const;

function statusErrorText(value: string | null): string | null {
  if (!value) return null;
  if (value === "remote_catalog_unconfigured") return "当前构建未配置远程词库地址。";
  if (value === "bundled_catalog_invalid") return "内置词库无效。";
  if (value.startsWith("catalog_request_failed")) return "词库请求失败，请检查网络后重试。";
  if (value.startsWith("remote_http_error: ")) return `远程服务器返回 HTTP ${value.slice(19)}。`;
  if (value.startsWith("remote_catalog_invalid")) return "远程词库校验失败，已继续使用现有词库。";
  if (value.startsWith("cache_write_failed")) return "词库缓存写入失败。";
  return `词库操作失败（${value.replace(/[^\x20-\x7e]/gu, "?")}）。`;
}

function timeText(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "暂无";
}

export function SettingsContent() {
  const snapshot = useSyncExternalStore(translationStore.subscribe, translationStore.getSnapshot, translationStore.getSnapshot);
  const [busy, setBusy] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeMode(mode: DisplayMode) {
    if (mode === snapshot.settings.displayMode) return;
    setChangingMode(true);
    setError(null);
    try { await translationStore.setMode(mode); } catch (reason) { setError(String(reason)); } finally { setChangingMode(false); }
  }

  async function refresh() {
    setBusy(true);
    setError(null);
    try { await translationStore.refresh(); } catch (reason) { setError(String(reason)); } finally { setBusy(false); }
  }

  const { status } = snapshot;
  const statusError = statusErrorText(status.error);
  const etag = status.etag ? status.etag.replace(/^W\//, "").replaceAll('"', "").slice(0, 10) : "无";
  return (
    <DialogControlsSection>
      <Field
        label="显示模式"
        description={changingMode ? "正在保存…" : "选择后自动保存。双语显示“中文名 | 原名”，仅中文不显示原名。"}
        childrenLayout="below"
        childrenContainerWidth="max"
        inlineWrap="shift-children-below"
      >
        <Dropdown
          rgOptions={modeOptions}
          selectedOption={snapshot.settings.displayMode}
          disabled={changingMode}
          menuLabel="显示模式"
          onChange={(option) => void changeMode(option.data as DisplayMode)}
        />
      </Field>
      <Field label={`词库状态：${stateLabels[status.state]}`} description={`来源 ${status.source} · ${status.entryCount} 条 · ETag ${etag}`} />
      <Field label="最后成功更新" description={timeText(status.lastModified ?? status.lastSuccessfulUpdateAt)} />
      <Field label="上次检查" description={timeText(status.lastCheckedAt)} />
      {!status.patchCompatible && <Field label="兼容性提示" description="当前 Steam 客户端左栏结构暂不兼容，插件已安全停用名称补丁。" />}
      {(error ?? statusError) && <Field label="最近错误" description={error ?? statusError ?? ""} />}
      <DialogButton disabled={busy} onClick={() => void refresh()}>{busy ? "正在刷新…" : "立即刷新词库"}</DialogButton>
    </DialogControlsSection>
  );
}
