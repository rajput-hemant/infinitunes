import { useLocalSearchParams } from "expo-router";

import { SongScreen } from "~/features/song/song-screen";

export default function SongRoute() {
  const { token } = useLocalSearchParams<"/song/[name]/[token]">();
  return <SongScreen token={token} />;
}
