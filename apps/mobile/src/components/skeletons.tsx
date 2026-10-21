import { View } from "react-native";
import type { DimensionValue } from "react-native";

import { textStyles } from "~/theme/tokens";
import type { TextVariant } from "~/theme/tokens";

import type { MediaCardVariant } from "./media-card";
import { artworkFrame } from "./ui/artwork";
import { range, SkeletonBlock, SkeletonPulse } from "./ui/skeleton";

/**
 * Loading placeholders that mirror the real layouts (`ListRow`, `Shelf`,
 * `EntityHeader`) at their real sizes, so content lands without a jump. Each
 * export is one pulse; compose the parts inside a single `SkeletonPulse`.
 */

/** No window-sized art here (`player`), so any width resolves the fixed sizes. */
const frame = (size: Parameters<typeof artworkFrame>[0], round = false) =>
  artworkFrame(size, 0, round);

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

function SongRowSkeleton() {
  return (
    <View className="min-h-row flex-row items-center gap-3 py-2 pl-page pr-4">
      <SkeletonBlock style={frame("row")} />
      <View className="flex-1">
        <SkeletonText variant="body" width="60%" />
        <SkeletonText variant="footnote" width="40%" />
      </View>
    </View>
  );
}

export function SongListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonPulse>
      {range(rows).map((row) => (
        <SongRowSkeleton key={row} />
      ))}
    </SkeletonPulse>
  );
}

function HeaderLine() {
  return (
    <View className="px-page pb-2 pt-6">
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

type ShelfSkeletonProps = {
  cards?: number;
  /** `hero`: the untitled featured carousel's larger cards. */
  variant?: MediaCardVariant;
};

export function ShelfSkeleton({
  cards = 3,
  variant = "card",
}: ShelfSkeletonProps) {
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
              <SkeletonText
                variant={hero ? "headline" : "subhead"}
                width="80%"
              />
              <SkeletonText variant="footnote" width="60%" />
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
        <SkeletonBlock className="h-8 w-full rounded-full" />
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
};

export function EntityHeaderSkeleton({
  round = false,
  shuffle = true,
}: EntityHeaderSkeletonProps) {
  return (
    <SkeletonPulse>
      <View className="items-center px-page pb-4 pt-2">
        <SkeletonBlock style={frame("header", round)} />
        <View className="mt-4">
          <SkeletonText variant="caption" width={96} />
        </View>
        <View className="mt-1">
          <SkeletonText variant="title1" width={200} />
        </View>
        <SkeletonText variant="subhead" width={140} />
        <SkeletonText variant="footnote" width={180} />
        <View className="mt-4 w-full flex-row gap-3">
          <SkeletonBlock className="h-touch flex-1 rounded-full" />
          {shuffle ? (
            <SkeletonBlock className="h-touch flex-1 rounded-full" />
          ) : null}
        </View>
        {/* The heart and the menu, 48pt targets 24 apart. */}
        <View className="mt-2 flex-row gap-6">
          {range(2).map((control) => (
            <View
              key={control}
              className="size-touch items-center justify-center"
            >
              <SkeletonBlock className="size-6 rounded-full" />
            </View>
          ))}
        </View>
      </View>
    </SkeletonPulse>
  );
}
