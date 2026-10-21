import { useLocalSearchParams } from "expo-router";

import { StationScreen } from "~/features/radio/station-screen";

export default function StationRoute() {
  const { name, token } = useLocalSearchParams<"/radio/[name]/[token]">();
  return <StationScreen name={name} token={token} />;
}
