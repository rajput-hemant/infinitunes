import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Platform, Pressable, View } from "react-native";

import { TEXT_BUTTON_HIT_SLOP } from "./ui/hit-slop";
import { Text } from "./ui/text";

export type SectionHeaderAction = {
  label: string;
  /** A link ("See All") when set... */
  href?: Href;
  /** ...else a button ("Clear"). */
  onPress?: () => void;
  /** Defaults to the label and the section title ("See All New Releases"). */
  accessibilityLabel?: string;
};

type SectionHeaderProps = {
  title: string;
  action?: SectionHeaderAction;
};

/**
 * The title of every titled group (shelves, quick picks, search groups,
 * library and detail sections): `title2`, 16 above and 8 below, and an
 * optional text action at the end. Sections add no padding of their own.
 */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    // The title's line is the header's minimum height.
    <View className="flex-row items-center justify-between gap-3 px-page pb-2 pt-4">
      <Text
        variant="title2"
        emphasized
        accessibilityRole="header"
        numberOfLines={1}
        className="shrink"
      >
        {title}
      </Text>
      {action ? <HeaderAction action={action} title={title} /> : null}
    </View>
  );
}

function HeaderAction({
  action,
  title,
}: {
  action: SectionHeaderAction;
  title: string;
}) {
  const { label, href, onPress } = action;
  const button = (
    <Pressable
      onPress={onPress}
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={action.accessibilityLabel ?? `${label} ${title}`}
      hitSlop={TEXT_BUTTON_HIT_SLOP}
      className="active:opacity-60"
    >
      {/* Android: a Material text button in the primary colour. */}
      {Platform.OS === "android" ? (
        <Text variant="label" tone="primary">
          {label}
        </Text>
      ) : (
        <Text variant="subhead" tone="muted">
          {label}
        </Text>
      )}
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {button}
    </Link>
  ) : (
    button
  );
}
