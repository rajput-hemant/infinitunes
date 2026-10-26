import { Image } from "expo-image";
import type { ReactNode } from "react";
import { useColorScheme, View } from "react-native";

import { FormScreen } from "~/components/form/form-screen";
import { Text } from "~/components/ui/text";
import { art, radii } from "~/theme/tokens";

// Metro resolves an image `require` to an asset id.
const ICON: number = require("../../../assets/icon.png");
const ICON_DARK: number = require("../../../assets/icon-dark.png");

type AuthScreenProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * The shared frame of the sign-in screens: the app icon, the heading, then
 * the form and its links. The navigation bar carries only a small title, so
 * the heading is the screen's own large title.
 */
export function AuthScreen({ title, description, children }: AuthScreenProps) {
  const dark = useColorScheme() === "dark";
  return (
    <FormScreen>
      {/* The icon over a title over its subtitle: line heights space the text. */}
      <View className="gap-3">
        <Image
          source={dark ? ICON_DARK : ICON}
          style={{ width: art.tile, height: art.tile, borderRadius: radii.md }}
        />
        <View>
          <Text variant="largeTitle" accessibilityRole="header">
            {title}
          </Text>
          <Text tone="muted">{description}</Text>
        </View>
      </View>
      {children}
    </FormScreen>
  );
}
