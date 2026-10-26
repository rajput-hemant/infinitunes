import type { MenuComponentRef } from "@expo/ui/community/menu";
import type { MediaType } from "@infinitunes/types";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { ComponentProps, ReactElement } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { AccessibilityActionEvent } from "react-native";

import { longPress } from "~/lib/haptics";
import { isPlayable, playEntity, queueEntity } from "~/playback/play-entity";

import { NativeMenu } from "./native-menu";
import type { MenuEntry } from "./native-menu";

type CardTarget = { type: MediaType; url: string };

/**
 * What a card offers besides opening its item: Play, and for a fixed list
 * Play Next and Add to Queue. Empty for a type nothing can play.
 */
export function cardMenuEntries({ type, url }: CardTarget): MenuEntry[] {
  if (!isPlayable(type)) return [];
  const play: MenuEntry = {
    id: "play",
    title: "Play",
    image: "play",
    run: () => void playEntity(type, url),
  };
  if (type === "radio_station") return [play];
  return [
    play,
    {
      id: "play-next",
      title: "Play Next",
      image: "text.line.first.and.arrowtriangle.forward",
      run: () => void queueEntity(type, url, "next"),
    },
    {
      id: "add-to-queue",
      title: "Add to Queue",
      image: "text.line.last.and.arrowtriangle.forward",
      run: () => void queueEntity(type, url, "last"),
    },
  ];
}

/** `cardMenuEntries`, kept while the item stays the same (a card re-renders often in a list). */
export function useCardMenuEntries(
  item: CardTarget | undefined,
): readonly MenuEntry[] {
  const type = item?.type;
  const url = item?.url;
  return useMemo(
    () => (type && url ? cardMenuEntries({ type, url }) : []),
    [type, url],
  );
}

/**
 * The same entries as screen reader actions on the card's link, so VoiceOver
 * and TalkBack reach what a long press shows.
 */
export function cardAccessibilityActions(entries: readonly MenuEntry[]) {
  if (entries.length === 0) return {};
  return {
    accessibilityActions: entries.map(({ id, title }) => ({
      name: id,
      label: title,
    })),
    onAccessibilityAction: ({ nativeEvent }: AccessibilityActionEvent) =>
      entries.find(({ id }) => id === nativeEvent.actionName)?.run?.(),
  };
}

type CardLinkProps = {
  href: Href;
  /** The menu's title. */
  name: string;
  entries: readonly MenuEntry[];
  /**
   * The card's `Pressable`; pass `onLongPress` to it. A long press then only
   * opens the menu: it never also follows the link on release.
   */
  children: (onLongPress: (() => void) | undefined) => ReactElement;
};

/**
 * Whether the link's own context menu exists: expo-router draws it with a
 * native view that only the new architecture on iOS has, and renders nothing
 * (not even the card) without it. Jest has none either.
 */
const LINK_MENUS =
  Platform.OS === "ios" &&
  (globalThis as { RN$Bridgeless?: boolean }).RN$Bridgeless === true;

/**
 * A card's link with its long-press menu (C4: cards carry no Play button).
 * A shelf holds dozens of cards, so no card keeps a native menu host of its
 * own: iOS uses the link's own context menu (`Link.Menu`, part of the link's
 * native view), Android mounts its menu the first time the card is long
 * pressed.
 */
export function CardLink({ href, name, entries, children }: CardLinkProps) {
  if (entries.length === 0) {
    return (
      <Link href={href} asChild>
        {children(undefined)}
      </Link>
    );
  }
  return LINK_MENUS ? (
    <Link href={href} asChild>
      {/* The system's context menu takes the long press. */}
      <Link.Trigger>{children(ignoreLongPress)}</Link.Trigger>
      <Link.Preview />
      <Link.Menu title={name}>
        {entries.map(({ id, title, image, run }) => (
          <Link.MenuAction
            key={id}
            icon={image as SymbolName | undefined}
            onPress={run}
          >
            {title}
          </Link.MenuAction>
        ))}
      </Link.Menu>
    </Link>
  ) : (
    <AndroidCardLink href={href} name={name} entries={entries}>
      {children}
    </AndroidCardLink>
  );
}

/** An SF Symbol name, as `Link.MenuAction` types it. */
type SymbolName = ComponentProps<typeof Link.MenuAction>["icon"];

function ignoreLongPress() {}

/** Android's card (and any platform without link menus): the menu mounts on the first long press. */
function AndroidCardLink({ href, name, entries, children }: CardLinkProps) {
  const [requested, setRequested] = useState(false);
  // The menu's handle as state (a callback ref), so render never reads a ref.
  const [menu, setMenu] = useState<MenuComponentRef | null>(null);

  // The first long press mounts the menu; it opens once its handle exists.
  useEffect(() => {
    if (requested) menu?.show();
  }, [requested, menu]);

  function open() {
    longPress();
    if (menu) menu.show();
    else setRequested(true);
  }

  return (
    <View>
      <Link href={href} asChild>
        {children(open)}
      </Link>
      {requested ? (
        // The anchor covers the card, so the dropdown opens over it; touches
        // still reach the card.
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NativeMenu title={name} entries={entries} ref={setMenu}>
            <View testID="card-menu" style={styles.anchor} />
          </NativeMenu>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ anchor: { flex: 1 } });
