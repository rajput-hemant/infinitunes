import { useLocalSearchParams } from "expo-router";

import { EpisodeScreen } from "~/features/episode/episode-screen";

export default function EpisodeRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <EpisodeScreen token={token} />;
}
