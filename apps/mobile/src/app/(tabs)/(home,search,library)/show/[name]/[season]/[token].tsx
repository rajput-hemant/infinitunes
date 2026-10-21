import { useLocalSearchParams } from "expo-router";

import { ShowScreen } from "~/features/show/show-screen";

export default function ShowRoute() {
  const { season, token } =
    useLocalSearchParams<"/show/[name]/[season]/[token]">();
  return <ShowScreen token={token} season={Number(season)} />;
}
