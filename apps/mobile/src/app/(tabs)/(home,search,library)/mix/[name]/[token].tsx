import { useLocalSearchParams } from "expo-router";

import { MixScreen } from "~/features/mix/mix-screen";

export default function MixRoute() {
  const { token } = useLocalSearchParams<"/mix/[name]/[token]">();
  return <MixScreen token={token} />;
}
