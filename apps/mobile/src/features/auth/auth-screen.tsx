import type { ReactNode } from "react";

import { Text } from "~/components/ui/text";

import { FormScreen } from "./form/form-screen";

type AuthScreenProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** The shared frame of the sign-in screens: heading, then the form and its links. */
export function AuthScreen({ title, description, children }: AuthScreenProps) {
  return (
    <FormScreen>
      <Text variant="largeTitle" accessibilityRole="header">
        {title}
      </Text>
      <Text tone="muted">{description}</Text>
      {children}
    </FormScreen>
  );
}
