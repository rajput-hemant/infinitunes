import { View } from "react-native";

import { SheetHeader } from "~/components/sheet-header";
import { NewPlaylistScreen } from "~/features/library/new-playlist-screen";
import { useSheetBottomInset } from "~/navigation/sheet-inset";

/** "New Playlist" from a song or collection menu: a sheet over any tab. */
export default function CreatePlaylistRoute() {
  // Android: keep the form's last field and button clear of the 3-button bar.
  const bottomInset = useSheetBottomInset();
  return (
    <View className="flex-1" style={{ paddingBottom: bottomInset }}>
      <SheetHeader title="New Playlist" />
      <NewPlaylistScreen />
    </View>
  );
}
