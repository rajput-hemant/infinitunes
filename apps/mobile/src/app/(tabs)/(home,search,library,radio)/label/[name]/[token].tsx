import { useLocalSearchParams } from "expo-router";

import { LabelScreen } from "~/features/label/label-screen";

export default function LabelRoute() {
  const { token } = useLocalSearchParams<"/label/[name]/[token]">();
  return <LabelScreen token={token} />;
}
