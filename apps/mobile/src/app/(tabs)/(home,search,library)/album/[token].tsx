import { useLocalSearchParams } from "expo-router";

import { AlbumScreen } from "~/features/album/album-screen";

export default function AlbumRoute() {
  const { token } = useLocalSearchParams<"/album/[token]">();
  return <AlbumScreen token={token} />;
}
