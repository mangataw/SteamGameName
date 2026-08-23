import { useSyncExternalStore } from "react";
import { translationStore } from "../services/translationStore";
import { formatDisplayName } from "../translation/formatDisplayName";

interface Props {
  appId: number | string;
  originalName: string;
}

export function TranslatedGameName({ appId, originalName }: Props) {
  const snapshot = useSyncExternalStore(
    translationStore.subscribe,
    translationStore.getSnapshot,
    translationStore.getSnapshot,
  );
  return <>{formatDisplayName(appId, originalName, snapshot.catalog, snapshot.settings.displayMode)}</>;
}

