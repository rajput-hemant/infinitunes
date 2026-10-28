import type { SongRowItem } from "@infinitunes/types";
import { Platform, Pressable, View } from "react-native";

import {
  cancelDownloads,
  useBatchOf,
  useSongProgress,
} from "~/lib/download-store";
import { tap } from "~/lib/haptics";
import { iconSize, sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import { downloadAll } from "./collection-menu";
import { DownloadRing } from "./download-ring";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";

type DownloadButtonProps = {
  title: string;
  songs: readonly SongRowItem[];
  /** The tonal container's colour (a wash's translucent fill). */
  fill: string;
};

/**
 * A collection's Download button. While its own run goes it is the overall
 * ring (songs done plus the one in flight, over the total) around a stop
 * mark, and a press cancels. It matches the tonal `IconButton` it replaces.
 */
export function DownloadButton({ title, songs, fill }: DownloadButtonProps) {
  const batch = useBatchOf(songs[0]?.id);
  const current = useSongProgress(batch?.current ?? "");
  const ink = useTokenColor("secondary-foreground");
  if (!batch) {
    return (
      <IconButton
        icon={{ ios: "arrow.down.circle", android: "download" }}
        label={`Download ${title}`}
        variant="tonal"
        fill={fill}
        onPress={() => void downloadAll(songs)}
      />
    );
  }
  const finished = batch.saved + batch.failed;
  const position = Math.min(finished + 1, batch.total);
  const fraction = Math.min((finished + (current ?? 0)) / batch.total, 1);
  // The 48pt target is the outermost view (Android drops touches outside a
  // clipped parent); the container inside is the tonal button's.
  const edge = Platform.OS === "android" ? sizes.ctl : sizes.touch;
  return (
    <Pressable
      onPress={() => {
        tap();
        cancelDownloads();
      }}
      accessibilityRole="progressbar"
      accessibilityLabel={`Downloading ${position} of ${batch.total}, double tap to cancel`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      className="min-h-touch min-w-touch items-center justify-center"
    >
      <View
        className="items-center justify-center rounded-full"
        style={{ width: edge, height: edge, backgroundColor: fill }}
      >
        <View className="absolute">
          <DownloadRing size={iconSize.xl} fraction={fraction} />
        </View>
        <Icon
          name={{ ios: "stop.fill", android: "stop" }}
          size="xs"
          color={ink}
        />
      </View>
    </Pressable>
  );
}
