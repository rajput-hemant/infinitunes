import type { MenuComponentRef } from "@expo/ui/community/menu";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState } from "react";
import type { ComponentProps, ReactElement, Ref } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { AccessibilityActionEvent } from "react-native";

import { longPress } from "~/lib/haptics";

import { ContextPreview, useContextPreviewSize } from "./context-preview";
import type { ContextPreviewProps } from "./context-preview";
import type { MenuEntry } from "./native-menu";

/**
 * Whether the link's own context menu exists: expo-router draws it with a
 * native view that only the new architecture on iOS has, and renders nothing
 * (not even the card) without it. Jest has none either.
 */
export const LINK_MENUS =
  Platform.OS === "ios" &&
  (globalThis as { RN$Bridgeless?: boolean }).RN$Bridgeless === true;

/** An SF Symbol name, as `Link.MenuAction` types it. */
type SymbolName = ComponentProps<typeof Link.MenuAction>["icon"];

/** Entries as the link's context menu items (iOS): quick groups inline, the rest actions or submenus. */
function linkEntries(entries: readonly MenuEntry[]): ReactElement[] {
  return entries.map((entry) =>
    entry.subactions ? (
      <Link.Menu
        key={entry.id}
        title={entry.title}
        icon={entry.image as SymbolName | undefined}
        inline={entry.quick}
        elementSize={entry.quick ? "small" : undefined}
      >
        {linkEntries(entry.subactions)}
      </Link.Menu>
    ) : (
      <Link.MenuAction
        key={entry.id}
        icon={entry.image as SymbolName | undefined}
        subtitle={entry.subtitle}
        destructive={entry.attributes?.destructive}
        disabled={entry.attributes?.disabled}
        isOn={entry.state === "on"}
        onPress={entry.run}
      >
        {entry.title}
      </Link.MenuAction>
    ),
  );
}

/** Every entry with an action, submenus' included, flattened. */
function runnable(entries: readonly MenuEntry[], prefix = ""): MenuEntry[] {
  return entries.flatMap((entry) =>
    entry.subactions
      ? // A quick group has no title; a submenu's items are named after it ("Go to Artist: Name").
        runnable(entry.subactions, entry.quick ? prefix : `${entry.title}: `)
      : entry.run
        ? [{ ...entry, title: prefix + entry.title }]
        : [],
  );
}

/**
 * The same entries as screen reader actions on the row or card, so VoiceOver
 * and TalkBack reach what a long press shows. The playlist list is long and
 * lives in its submenu, so its items are left out.
 */
export function menuAccessibilityActions(entries: readonly MenuEntry[]) {
  const actions = runnable(entries).filter(
    (entry) => entry.id !== "new-playlist" && !entry.id.startsWith("playlist:"),
  );
  if (actions.length === 0) return {};
  return {
    accessibilityActions: actions.map(({ id, title }) => ({
      name: id,
      label: title,
    })),
    onAccessibilityAction: ({ nativeEvent }: AccessibilityActionEvent) =>
      actions.find(({ id }) => id === nativeEvent.actionName)?.run?.(),
  };
}

type ContextLinkProps = {
  href: Href;
  entries: readonly MenuEntry[];
  preview: ContextPreviewProps;
  /** Whether a tap follows the link; a song row plays on tap, only the preview opens the song. */
  tapOpens?: boolean;
  /** Gets `wrap`: put the pressable inside it (`ListRow`'s `wrap`, or `wrap(<Pressable />)`). */
  children: (wrap: (pressable: ReactElement) => ReactElement) => ReactElement;
};

/**
 * iOS: the link's own context menu (`Link.Menu`, part of the link's native
 * view, no host per item) with a compact preview card (`Link.Preview` with
 * children and an explicit size) instead of the destination's live screen.
 * The system takes the long press, so the pressable gets none.
 */
export function ContextLink({
  href,
  entries,
  preview,
  tapOpens = true,
  children,
}: ContextLinkProps) {
  const { width, height } = useContextPreviewSize(preview);
  return children((pressable) => (
    <Link
      href={href}
      asChild
      onPress={tapOpens ? undefined : (event) => event.preventDefault()}
    >
      <Link.Trigger>{pressable}</Link.Trigger>
      <Link.Preview style={{ width, height }}>
        <ContextPreview {...preview} />
      </Link.Preview>
      <Link.Menu title="">{linkEntries(entries)}</Link.Menu>
    </Link>
  ));
}

type LongPressMenuProps = {
  /** The item's screen: a tap follows it. */
  href?: Href;
  /** The pressable; pass `onLongPress` to it. */
  children: (onLongPress: () => void) => ReactElement;
  /** The menu, mounted on the first long press: `anchor` is its trigger, `ref` its handle. */
  renderMenu: (
    options: { ref?: Ref<MenuComponentRef>; openOnLongPress?: boolean },
    anchor: ReactElement,
  ) => ReactElement;
  testID?: string;
};

function ignoreLongPress() {}

/**
 * Without link menus: Android's dropdown mounts on the first long press
 * (below); iOS (an old-architecture build, or an item with no screen) wraps
 * the item in the system context menu, opened by the user's own long press,
 * as SwiftUI menus cannot be opened from code (`show()` warns there).
 */
export function LongPressMenu(props: LongPressMenuProps) {
  if (Platform.OS !== "ios") return <AndroidLongPressMenu {...props} />;
  const { href, children, renderMenu } = props;
  const pressable = children(ignoreLongPress);
  return renderMenu(
    { openOnLongPress: true },
    href ? (
      <Link href={href} asChild>
        {pressable}
      </Link>
    ) : (
      pressable
    ),
  );
}

/**
 * A list holds dozens of items, so the dropdown, with its subscriptions,
 * mounts the first time one is long pressed and opens once its handle exists.
 */
function AndroidLongPressMenu({
  href,
  children,
  renderMenu,
  testID = "card-menu",
}: LongPressMenuProps) {
  const [requested, setRequested] = useState(false);
  // The menu's handle as state (a callback ref), so render never reads a ref.
  const [handle, setHandle] = useState<MenuComponentRef | null>(null);

  useEffect(() => {
    if (requested) handle?.show();
  }, [requested, handle]);

  function open() {
    longPress();
    if (handle) handle.show();
    else setRequested(true);
  }

  const pressable = children(open);
  return (
    <View>
      {href ? (
        <Link href={href} asChild>
          {pressable}
        </Link>
      ) : (
        pressable
      )}
      {requested ? (
        // The anchor covers the item, so the dropdown opens over it; touches
        // still reach the item.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {renderMenu(
            { ref: setHandle },
            <View testID={testID} style={styles.anchor} />,
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ anchor: { flex: 1 } });
