import { useLocalSearchParams } from "expo-router";

import { PlaylistScreen } from "~/features/playlist/playlist-screen";

export default function PlaylistRoute() {
  const { token } = useLocalSearchParams<"/playlist/[token]">();
  return <PlaylistScreen token={token} />;
}
