import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import type { DimensionValue } from "react-native";

import { cx } from "~/lib/class-names";
import { iconSize, textStyles } from "~/theme/tokens";
import type { ArtSize, TextVariant } from "~/theme/tokens";
import { useRadii } from "~/theme/use-radii";
import { useUserId } from "~/user-data/session";

import { CARD_TITLE } from "./media-card";
import type { MediaCardVariant } from "./media-card";
import { artworkFrame } from "./ui/artwork";
import { range, SkeletonBlock, SkeletonPulse } from "./ui/skeleton";

/**
 * Loading placeholders that mirror the real layouts (`ListRow`, `Shelf`,
 * `EntityHeader`) at their real sizes, so content lands without a jump. Each
 * export is one pulse; compose the parts inside a single `SkeletonPulse`.
 */

/**
 * Artwork's frame at the listener's corner style, as `Artwork` draws it. No
 * window-sized art here (`player`), so any width resolves the fixed sizes.
 */
function useFrame() {
  const scale = useRadii();
  return (size: Exclude<ArtSize, "player">, round = false) =>
    artworkFrame(size, 0, round, scale);
}

type SkeletonTextProps = {
  variant: TextVariant;
  width: DimensionValue;
};

/**
 * One line of text: as tall as the variant's line, with a bar the height of
 * its font size, so the placeholder stands exactly where the text will.
 */
export function SkeletonText({ variant, width }: SkeletonTextProps) {
  const { fontSize, lineHeight } = textStyles[variant];
  return (
    <View
      testID="skeleton-text"
      style={{ width, height: lineHeight }}
      className="justify-center"
    >
      <SkeletonBlock
        className="w-full rounded-xs"
        style={{ height: fontSize }}
      />
    </View>
  );
}

function SongRowSkeleton({ numbered }: { numbered: boolean }) {
  const frame = useFrame();
  return (
    <View className="min-h-row flex-row items-center gap-3 py-1 pl-page pr-4">
      {numbered ? (
        // The track number's 48pt column, then the length at the row's end.
        <View className="w-touch items-center">
          <SkeletonText variant="body" width={iconSize.sm} />
        </View>
      ) : (
        <SkeletonBlock style={frame("row")} />
      )}
      <View className="flex-1">
        <SkeletonText variant="body" width="60%" />
        <SkeletonText variant="footnote" width="40%" />
      </View>
      {numbered ? (
        <SkeletonText variant="footnote" width={iconSize.xl} />
      ) : null}
    </View>
  );
}

type SongListSkeletonProps = {
  rows?: number;
  /** Placeholders above the rows, in the same pulse (a list's controls). */
  header?: ReactNode;
  /** Track numbers and lengths instead of artwork (`TrackList numbered`). */
  numbered?: boolean;
};

export function SongListSkeleton({
  rows = 8,
  header,
  numbered = false,
}: SongListSkeletonProps) {
  return (
    <SkeletonPulse>
      {header}
      {range(rows).map((row) => (
        <SongRowSkeleton key={row} numbered={numbered} />
      ))}
    </SkeletonPulse>
  );
}

function HeaderLine() {
  return (
    <View className="px-page pb-2 pt-4">
      <SkeletonText variant="title2" width="40%" />
    </View>
  );
}

/** `SectionHeader` while its section loads. */
export function SectionHeaderSkeleton() {
  return (
    <SkeletonPulse>
      <HeaderLine />
    </SkeletonPulse>
  );
}

/** A `MediaCard`'s title and subtitle lines, in its own text roles. */
export function CardTextSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <>
      <SkeletonText
        variant={hero ? "headline" : CARD_TITLE.variant}
        width="80%"
      />
      <SkeletonText variant={hero ? "footnote" : "caption"} width="60%" />
    </>
  );
}

type ShelfSkeletonProps = {
  cards?: number;
  /** `hero`: the untitled featured carousel's larger cards. */
  variant?: MediaCardVariant;
};

export function ShelfSkeleton({
  cards = 3,
  variant = "card",
}: ShelfSkeletonProps) {
  const frame = useFrame();
  const hero = variant === "hero";
  const art = frame(hero ? "hero" : "card");
  return (
    <SkeletonPulse>
      {hero ? null : <HeaderLine />}
      <View className="flex-row gap-3 overflow-hidden px-page">
        {range(cards).map((card) => (
          <View key={card} className="gap-2" style={{ width: art.width }}>
            <SkeletonBlock style={art} />
            <View>
              {hero ? <SkeletonText variant="caption" width="40%" /> : null}
              <CardTextSkeleton hero={hero} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}

/** `SegmentedTabs` while its screen loads. */
export function SegmentedTabsSkeleton() {
  return (
    <SkeletonPulse>
      <View className="px-page pb-2">
        {/* Android's connected button group is 40dp; iOS's control is 32pt. */}
        <SkeletonBlock
          className={cx(
            "w-full",
            Platform.OS === "android" ? "h-ctl rounded-full" : "h-8 rounded-sm",
          )}
        />
      </View>
    </SkeletonPulse>
  );
}

/** A section title and two lines of text, e.g. a description under its header. */
export function TextBlockSkeleton() {
  return (
    <SkeletonPulse>
      <HeaderLine />
      <View className="px-page">
        <SkeletonText variant="body" width="100%" />
        <SkeletonText variant="body" width="80%" />
      </View>
    </SkeletonPulse>
  );
}

type EntityHeaderSkeletonProps = {
  /** Round artwork, for artists and stations. */
  round?: boolean;
  /** A Shuffle button beside Play, as the loaded header will have. */
  shuffle?: boolean;
  /** The header's heart (shown only to a signed-in listener). */
  like?: boolean;
  /** The header's actions menu. */
  menu?: boolean;
  /** The credit line under the title. */
  subtitle?: boolean;
  /** The muted meta line. */
  meta?: boolean;
};

export function EntityHeaderSkeleton({
  round = false,
  shuffle = true,
  like = true,
  menu = true,
  subtitle = true,
  meta = true,
}: EntityHeaderSkeletonProps) {
  const frame = useFrame();
  // Signed out, the header has no heart (`LikeButton` renders nothing).
  const signedIn = useUserId() !== undefined;
  const controls = Number(like && signedIn) + Number(menu);
  return (
    <SkeletonPulse>
      <View className="items-center px-page pb-4 pt-2">
        <SkeletonBlock style={frame("header", round)} />
        <View className="mt-3">
          <SkeletonText variant="caption" width={96} />
        </View>
        <View className="mt-1">
          <SkeletonText variant="title2" width={200} />
        </View>
        {subtitle ? <SkeletonText variant="subhead" width={140} /> : null}
        {meta ? <SkeletonText variant="footnote" width={180} /> : null}
        {/* The heart and the menu, then Shuffle and the 56pt Play. */}
        <View className="mt-4 w-full flex-row items-center gap-2">
          {range(controls).map((control) => (
            <View
              key={control}
              className="size-touch items-center justify-center"
            >
              <SkeletonBlock className="size-6 rounded-full" />
            </View>
          ))}
          <View className="flex-1" />
          {shuffle ? (
            <SkeletonBlock className="size-touch rounded-full" />
          ) : null}
          <SkeletonBlock className="size-row rounded-full" />
        </View>
      </View>
    </SkeletonPulse>
  );
}
