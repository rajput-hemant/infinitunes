import type { MediaType } from "@infinitunes/types";
import type { Href } from "expo-router";

import { ListRow } from "./list-row";

type MediaRowProps = {
  title: string;
  subtitle?: string;
  /** Raw upstream artwork URL; resized for a row here. */
  image: string;
  /** Round artwork, for artists and stations. */
  round?: boolean;
  /** The item's screen: the row is a link to it. */
  href?: Href;
  /** What a tap does instead, when the row is not a link. */
  onPress?: () => void;
  /** The catalog item it opens, to prefetch on press-in. */
  entity?: { type: MediaType; url: string };
};

/** A catalog item as a list row: its artwork, title and subtitle (`ListRow`). */
export function MediaRow({
  title,
  subtitle,
  image,
  round,
  href,
  onPress,
  entity,
}: MediaRowProps) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      leading={{ artwork: image, round }}
      href={href}
      onPress={onPress}
      entity={entity}
    />
  );
}
