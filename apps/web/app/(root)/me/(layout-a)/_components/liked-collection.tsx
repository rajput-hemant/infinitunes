import type { ComponentProps } from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import {
  LibraryEmpty,
  LibraryHeading,
  LibraryUnavailable,
} from "~/components/library/library-section";
import {
  SliderCard,
  type SliderCardProps,
} from "~/components/slider/slider-card";

type LikedCollectionProps<T> = {
  /** Saved tokens/ids from the user's favorites; duplicates are ignored. */
  tokens: string[];
  /** Singular lowercase noun, e.g. `album`; plural is `${noun}s`. */
  noun: string;
  /** Resolves one saved token; `undefined` or a rejection counts as missing. */
  fetchItem: (token: string) => Promise<T | undefined>;
  toCard: (item: T) => SliderCardProps;
  empty: Pick<ComponentProps<typeof LibraryEmpty>, "icon" | "description"> & {
    action: NonNullable<ComponentProps<typeof LibraryEmpty>["action"]>;
  };
};

/**
 * Library page body for a liked-entity collection: resolves every saved token,
 * shows the cards that loaded, an "unavailable" state when none could be
 * fetched, or the empty state when nothing is saved.
 */
export async function LikedCollection<T>(props: LikedCollectionProps<T>) {
  const { noun, fetchItem, toCard, empty } = props;
  const tokens = [...new Set(props.tokens)];
  const plural = `${noun}s`;

  if (!tokens.length) {
    return (
      <LibraryEmpty
        icon={empty.icon}
        title={`No liked ${plural} yet`}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  const settled = await Promise.allSettled(tokens.map(fetchItem));
  const cards = settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [toCard(result.value)] : [],
  );

  if (!cards.length) return <LibraryUnavailable what={`liked ${plural}`} />;

  return (
    <div className="flex flex-col gap-4">
      <LibraryHeading
        title={`Liked ${noun.charAt(0).toUpperCase()}${plural.slice(1)}`}
        count={cards.length}
        noun={noun}
        missing={tokens.length - cards.length}
      />

      <CatalogGrid>
        {cards.map((card) => (
          <SliderCard key={card.url} {...card} />
        ))}
      </CatalogGrid>
    </div>
  );
}
