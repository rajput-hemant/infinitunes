import type { ReactNode } from "react";
import { View } from "react-native";

import { FormScreen } from "~/components/form/form-screen";
import { Text } from "~/components/ui/text";

type AuthScreenProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * The shared frame of the sign-in screens: heading, then the form and its
 * links. The navigation bar carries only a small title, so the heading is
 * the screen's own large title.
 */
export function AuthScreen({ title, description, children }: AuthScreenProps) {
  return (
    <FormScreen>
      {/* A title over its subtitle: their line heights space them. */}
      <View>
        <Text variant="largeTitle" accessibilityRole="header">
          {title}
        </Text>
        <Text tone="muted">{description}</Text>
      </View>
      {children}
    </FormScreen>
  );
}
