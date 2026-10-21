import { useLocalSearchParams } from "expo-router";

import { ArtistScreen } from "~/features/artist/artist-screen";

/** The artist's Overview; `[tab].tsx` opens the same screen on another tab. */
export default function ArtistRoute() {
  const { token } = useLocalSearchParams<"/artist/[name]/[token]">();
  return <ArtistScreen token={token} initialTab="overview" />;
}
