import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Text } from "~/components/ui/text";

export default function LibraryScreen() {
  return (
    <ScreenScrollView contentContainerClassName="px-page">
      <Text tone="muted">Your liked songs and playlists will appear here.</Text>
    </ScreenScrollView>
  );
}
