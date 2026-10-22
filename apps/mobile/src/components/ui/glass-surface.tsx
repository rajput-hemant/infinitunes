import { View } from "react-native";
import type { ViewProps } from "react-native";

import { useTokenColor } from "~/theme/use-palette";

/**
 * A floating control's background: an elevated Material 3 surface container
 * (`surfaceContainerHigh`; Android has no glass material).
 */
export function GlassSurface({ style, ...props }: ViewProps) {
  const card = useTokenColor("card");
  return (
    <View style={[{ backgroundColor: card, elevation: 3 }, style]} {...props} />
  );
}
