import { useLocalSearchParams } from "expo-router";

import { LabelScreen } from "~/features/label/label-screen";

export default function LabelRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <LabelScreen token={token} />;
}
