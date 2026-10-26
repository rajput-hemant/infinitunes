import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import type { DimensionValue } from "react-native";
import { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";

import { cx } from "~/lib/class-names";
import { iconSize, space, textStyles } from "~/theme/tokens";
import type { ArtSize, TextVariant } from "~/theme/tokens";
import { useRadii } from "~/theme/use-radii";
import { useUserId } from "~/user-data/session";

import { ENTITY_TITLE_VARIANT } from "./entity-header";
import { CARD_TITLE } from "./media-card";
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

/**
 * How loaded content replaces its skeleton: a fade in, with the skeleton
 * fading out (`CONTENT_CONCEAL`) where it can. Opacity alone carries no movement, so it runs under reduce motion.
 */
export const CONTENT_REVEAL = FadeIn.duration(200).reduceMotion(
  ReduceMotion.Never,
);

/** The skeleton's matching exit: it fades out while the content fades in (a crossfade). */
export const CONTENT_CONCEAL = FadeOut.duration(200).reduceMotion(
  ReduceMotion.Never,
);

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

/**
 * The row's own trailing cells (`SongRow`): the length of a numbered row, the
 * heart (signed-in listeners only) and the menu's 48pt target.
 */
function SongRowSkeleton({ numbered }: { numbered: boolean }) {
  const frame = useFrame();
  const signedIn = useUserId() !== undefined;
  return (
    <View
      className="min-h-row flex-row items-center"
      style={{ paddingEnd: space.xs }}
    >
      <View className="min-h-row flex-1 flex-row items-center gap-3 py-1 pl-page">
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
      </View>
      {numbered ? (
        <SkeletonText variant="footnote" width={iconSize.xl} />
      ) : null}
      {signedIn ? <HeartCellSkeleton testID="row-skeleton-like" /> : null}
      <MenuGlyphSkeleton testID="row-skeleton-menu" />
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

export function ShelfSkeleton({ cards = 3 }: { cards?: number }) {
  const art = useFrame()("card");
  return (
    <SkeletonPulse>
      <HeaderLine />
      <View className="flex-row gap-3 overflow-hidden px-page">
        {range(cards).map((card) => (
          <View key={card} className="gap-2" style={{ width: art.width }}>
            <SkeletonBlock style={art} />
            <View>
              <CardTextSkeleton />
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

/** Three body lines and Read More: a clamped preview (`Description`, iOS's lyrics). */
function PreviewLines({ readMore }: { readMore: TextVariant }) {
  return (
    <>
      <View>
        {(["100%", "95%", "70%"] as const).map((width) => (
          <SkeletonText key={width} variant="body" width={width} />
        ))}
      </View>
      <SkeletonText variant={readMore} width={80} />
    </>
  );
}

/** A section title over a `Description` (a show's or episode's About). */
export function TextBlockSkeleton() {
  return (
    <SkeletonPulse>
      <HeaderLine />
      <View className="gap-1 px-page">
        <PreviewLines readMore="subhead" />
      </View>
    </SkeletonPulse>
  );
}

/**
 * The song page's lyrics while they load. Android mirrors the loaded preview
 * card (`bg-card`, four headline lines and Read More); iOS's preview is three
 * plain lines and Read More under its header (`LyricsSection`).
 */
export function LyricsSkeleton() {
  if (Platform.OS !== "android") {
    return (
      <SkeletonPulse>
        <HeaderLine />
        <View testID="lyrics-skeleton-plain" className="gap-2 px-page py-2">
          <PreviewLines readMore="subhead" />
        </View>
      </SkeletonPulse>
    );
  }
  return (
    <SkeletonPulse>
      <HeaderLine />
      <View
        testID="lyrics-skeleton-card"
        className="mx-page min-h-touch gap-3 rounded-lg bg-card p-4"
      >
        <View>
          {(["100%", "90%", "95%", "70%"] as const).map((width) => (
            <SkeletonText key={width} variant="headline" width={width} />
          ))}
        </View>
        <SkeletonText variant="label" width={80} />
      </View>
    </SkeletonPulse>
  );
}

/** `LikeButton`'s heart in its 48pt target. */
function HeartCellSkeleton({ testID }: { testID: string }) {
  return (
    <View testID={testID} className="size-touch items-center justify-center">
      <SkeletonBlock className="size-6 rounded-full" />
    </View>
  );
}

/**
 * The header's menu trigger (`MenuTrigger`): its three dots in their 48pt
 * target, upright on Android (`more_vert`), across on iOS (`ellipsis`).
 */
function MenuGlyphSkeleton({
  testID = "header-skeleton-menu",
}: {
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      className={cx(
        "size-touch items-center justify-center gap-1",
        Platform.OS === "android" ? "flex-col" : "flex-row",
      )}
    >
      {range(3).map((dot) => (
        <SkeletonBlock key={dot} className="size-1 rounded-full" />
      ))}
    </View>
  );
}

/** A round tonal button of the header's action row. */
function ActionCircleSkeleton({ testID }: { testID: string }) {
  return (
    <SkeletonBlock
      testID={testID}
      className={cx(
        Platform.OS === "android" ? "size-ctl" : "size-touch",
        "rounded-full",
      )}
    />
  );
}

type EntityHeaderSkeletonProps = {
  /** Round artwork, for artists and stations. */
  round?: boolean;
  /** A Shuffle button beside Play, as the loaded header will have. */
  shuffle?: boolean;
  /** The header's heart (shown only to a signed-in listener). */
  like?: boolean;
  /** The credit line under the title. */
  subtitle?: boolean;
  /** The muted meta line. */
  meta?: boolean;
};

export function EntityHeaderSkeleton({
  round = false,
  shuffle = true,
  like = true,
  subtitle = true,
  meta = true,
}: EntityHeaderSkeletonProps) {
  const frame = useFrame();
  // Signed out, the header has no heart (`LikeButton` renders nothing).
  const signedIn = useUserId() !== undefined;
  return (
    <SkeletonPulse>
      <View className="w-full max-w-readable items-center self-center px-page pb-6 pt-2">
        <SkeletonBlock style={frame("header", round)} />
        <View className="mt-4">
          <SkeletonText variant="caption" width={96} />
        </View>
        <View className="mt-1">
          <SkeletonText variant={ENTITY_TITLE_VARIANT} width={200} />
        </View>
        {subtitle ? <SkeletonText variant="subhead" width={140} /> : null}
        {meta ? <SkeletonText variant="footnote" width={180} /> : null}
        {/* Shuffle, Play and the heart, as the header's row: two round
            buttons around the Play capsule (Android 40dp, iOS 48pt). */}
        <View className="mt-6 w-full flex-row items-center gap-3">
          {shuffle ? (
            <ActionCircleSkeleton testID="header-skeleton-shuffle" />
          ) : null}
          <SkeletonBlock
            testID="header-skeleton-play"
            className={cx(
              Platform.OS === "android" ? "h-ctl" : "h-touch",
              "flex-1 rounded-full",
            )}
          />
          {like && signedIn ? (
            <ActionCircleSkeleton testID="header-skeleton-like" />
          ) : null}
        </View>
      </View>
    </SkeletonPulse>
  );
}
