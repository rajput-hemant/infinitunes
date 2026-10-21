import type { ArtistBioSection } from "@infinitunes/types";

import { renderEntityListItem } from "~/components/entity-list";
import type { EntityListItem } from "~/components/entity-list";

import { BioSection } from "./bio-section";

/** The artist screen's list rows: the shared song and card rows, plus the Bio tab's sections. */
export type ArtistListItem =
  | EntityListItem
  | { kind: "bio"; id: string; section: ArtistBioSection };

export function bioItems(
  sections: readonly ArtistBioSection[],
): ArtistListItem[] {
  return sections.map((section, index) => ({
    kind: "bio",
    id: `${index}-${section.title}`,
    section,
  }));
}

export function renderArtistListItem({ item }: { item: ArtistListItem }) {
  return item.kind === "bio" ? (
    <BioSection section={item.section} />
  ) : (
    renderEntityListItem({ item })
  );
}
