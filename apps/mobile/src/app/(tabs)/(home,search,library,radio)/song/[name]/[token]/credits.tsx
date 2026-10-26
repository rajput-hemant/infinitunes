import { useLocalSearchParams } from "expo-router";

import { CreditsScreen } from "~/features/song/credits-screen";

export default function SongCreditsRoute() {
  const { token } = useLocalSearchParams<"/song/[name]/[token]/credits">();
  return <CreditsScreen token={token} />;
}
