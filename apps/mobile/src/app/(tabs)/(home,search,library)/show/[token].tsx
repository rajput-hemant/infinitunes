import { useLocalSearchParams } from "expo-router";

import { ShowScreen } from "~/features/show/show-screen";

export default function ShowRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <ShowScreen token={token} />;
}
