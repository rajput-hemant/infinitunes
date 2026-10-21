import { Link } from "expo-router";
import type { Href } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";

type LibraryRowProps = {
  icon: SymbolViewProps["name"];
  title: string;
  subtitle?: string;
  /** Where the row goes; without it the row is not pressable (a pending write). */
  href?: Href;
  /** After the row's own press target: a menu or a chevron. */
  trailing?: ReactNode;
};

/** One library entry: an icon tile, a title with an optional subtitle, and a way in. */
export function LibraryRow({
  icon,
  title,
  subtitle,
  href,
  trailing,
}: LibraryRowProps) {
  const body = (
    <Pressable
      disabled={!href}
      accessibilityRole={href ? "link" : "text"}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled: !href }}
      className={cx(
        "flex-1 flex-row items-center gap-3 active:opacity-70",
        !href && "opacity-50",
      )}
    >
      <View className="size-art items-center justify-center rounded-sm bg-fill">
        <Icon name={icon} size={20} />
      </View>
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <View className="h-row flex-row items-center gap-3 pl-page pr-2">
      {href ? (
        <Link href={href} asChild>
          {body}
        </Link>
      ) : (
        body
      )}
      {trailing}
    </View>
  );
}
