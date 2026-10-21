import { useLocalSearchParams } from "expo-router";

import { ArtistScreen } from "~/features/artist/artist-screen";

export default function ArtistRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <ArtistScreen token={token} />;
}
