import type { CardItem } from "@infinitunes/types";
import { Link } from "expo-router";
import { Pressable } from "react-native";

import { MediaRow } from "~/components/media-row";
import { entityHref } from "~/navigation/entity-href";

/** A catalog item as a list row that opens its screen. */
export function AlbumRow({ card }: { card: CardItem }) {
  const href = entityHref(card.type, card.url);
  const row = (
    <MediaRow title={card.name} subtitle={card.subtitle} image={card.image} />
  );
  if (!href) return row;

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={
          card.subtitle ? `${card.name}, ${card.subtitle}` : card.name
        }
        className="active:opacity-70"
      >
        {row}
      </Pressable>
    </Link>
  );
}
