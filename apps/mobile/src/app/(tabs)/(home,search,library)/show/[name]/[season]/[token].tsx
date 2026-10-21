import { useLocalSearchParams } from "expo-router";

import { ShowScreen } from "~/features/show/show-screen";

/** A link's season segment as a season number; anything else opens the latest. */
const seasonOf = (segment: string) =>
  /^\d{1,4}$/.test(segment) ? Number(segment) : undefined;

export default function ShowRoute() {
  const { season, token } =
    useLocalSearchParams<"/show/[name]/[season]/[token]">();
  return <ShowScreen token={token} season={seasonOf(season)} />;
}
