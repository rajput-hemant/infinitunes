import type { MenuComponentRef } from "@expo/ui/community/menu";
import type { MediaType } from "@infinitunes/types";
import { useState } from "react";
import type { ReactElement } from "react";
import { Platform } from "react-native";
import type { AccessibilityActionEvent } from "react-native";

import { isPlayable, playEntity, queueEntity } from "~/playback/play-entity";

import { NativeMenu } from "./native-menu";
import type { MenuEntry } from "./native-menu";

type CardTarget = { type: MediaType; url: string; name: string };

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

type CardMenuProps = {
  name: string;
  entries: readonly MenuEntry[];
  /** The card's link; pass `onLongPress` to its `Pressable`. */
  children: (onLongPress: (() => void) | undefined) => ReactElement;
};

/**
 * A card's long-press context menu (C4: cards carry no Play button). iOS's
 * context menu takes the long press itself. Android's menu listens on a
 * wrapping `Pressable`, which the card's own link shadows as the touch
 * responder, so the link's long press opens it.
 */
export function CardMenu({ name, entries, children }: CardMenuProps) {
  // The menu's handle as state (a callback ref), so render never reads a ref.
  const [menu, setMenu] = useState<MenuComponentRef | null>(null);
  if (entries.length === 0) return children(undefined);
  const android = Platform.OS === "android";
  return (
    <NativeMenu
      title={name}
      entries={entries}
      openOnLongPress
      ref={android ? setMenu : undefined}
    >
      {children(menu?.show)}
    </NativeMenu>
  );
}
