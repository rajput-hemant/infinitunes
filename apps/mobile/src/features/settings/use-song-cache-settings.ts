import { useEffect } from "react";
import { Alert } from "react-native";

import { usePreferences } from "~/lib/preferences";
import {
  clearSongCache,
  formatCacheSize,
  refreshSongCacheSize,
  useSongCacheBytes,
} from "~/lib/song-cache";

export function useSongCacheSettings() {
  const enabled = usePreferences((state) => state.cacheFrequentSongs);
  const setEnabled = usePreferences((state) => state.setCacheFrequentSongs);
  const bytes = useSongCacheBytes();
  useEffect(() => {
    void refreshSongCacheSize().catch(() => undefined);
  }, []);
  return {
    enabled,
    setEnabled,
    size: formatCacheSize(bytes),
    clear: () =>
      Alert.alert(
        "Clear song cache?",
        "Songs will stream next time. Your downloads stay saved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear cache",
            style: "destructive",
            onPress: () => {
              void clearSongCache().catch(() => undefined);
            },
          },
        ],
      ),
  };
}
