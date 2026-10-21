import type { MediaType } from "@infinitunes/types";
import type { ReactElement } from "react";
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
  children: ReactElement;
};

/** A card's long-press context menu (C4: cards carry no Play button). */
export function CardMenu({ name, entries, children }: CardMenuProps) {
  if (entries.length === 0) return children;
  return (
    <NativeMenu title={name} entries={entries} openOnLongPress>
      {children}
    </NativeMenu>
  );
}
