import { tabForSegment } from "@infinitunes/core/entity-route";
import { useLocalSearchParams } from "expo-router";

import { ArtistScreen } from "~/features/artist/artist-screen";

/**
 * The web's artist tab routes (`/artist/<name>/<token>/songs`): the screen
 * opens on that tab. Switching tabs stays inside the screen, whose header
 * scrolls in the same list as the tab's rows.
 */
export default function ArtistTabRoute() {
  const { token, tab } = useLocalSearchParams<"/artist/[name]/[token]/[tab]">();
  return <ArtistScreen token={token} initialTab={tabForSegment(tab)} />;
}
