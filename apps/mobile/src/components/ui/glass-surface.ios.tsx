import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import type { ViewProps } from "react-native";

import { hasLiquidGlass } from "~/lib/platform";

/**
 * A floating control's background: interactive Liquid Glass on iOS 26, the
 * system chrome blur material below it.
 */
export function GlassSurface({ style, ...props }: ViewProps) {
  if (hasLiquidGlass) {
    return <GlassView isInteractive style={style} {...props} />;
  }
  return (
    <BlurView
      tint="systemChromeMaterial"
      intensity={100}
      style={[{ overflow: "hidden" }, style]}
      {...props}
    />
  );
}
