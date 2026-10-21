import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable } from "react-native";

import { Text } from "~/components/ui/text";

type FormLinkProps = {
  href: Href;
  /** Swaps the current screen instead of stacking on it. */
  replace?: boolean;
  tone?: "default" | "muted";
  children: string;
};

/** A text link under a form ("Forgot password?") with a full 48pt touch target. */
export function FormLink({
  href,
  replace,
  tone = "default",
  children,
}: FormLinkProps) {
  return (
    <Link href={href} replace={replace} asChild>
      <Pressable
        accessibilityRole="link"
        className="min-h-touch items-center justify-center px-2 active:opacity-70"
      >
        <Text tone={tone} className="text-center">
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}
