import { useSyncExternalStore } from "react";
import { translationStore } from "../services/translationStore";
import { appendActiveBeta, formatDisplayName } from "../translation/formatDisplayName";

interface Props {
  appId: number | string;
  originalName: string;
  activeBeta?: string;
}

export function TranslatedGameName({ appId, originalName, activeBeta }: Props) {
  const snapshot = useSyncExternalStore(
    translationStore.subscribe,
    translationStore.getSnapshot,
    translationStore.getSnapshot,
  );
  const displayName = formatDisplayName(appId, originalName, snapshot.catalog, snapshot.settings.displayMode);
  return <>{appendActiveBeta(displayName, activeBeta)}</>;
}
