import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useSongDownload, useSongProgress } from "~/lib/download-store";
import { iconSize, space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

/** A hairline ring: a quarter of it is drawn when the size is unknown. */
const STROKE = space.xs / 2;
const UNKNOWN_FRACTION = 0.25;

type DownloadRingProps = {
  /** The ring's edge in points: an `iconSize`. */
  size: number;
  /** 0..1, `null` while the size is unknown; `undefined` draws the track only (waiting). */
  fraction?: number | null;
};

/**
 * A thin progress ring in the accent colour over a quiet track. Static: it
 * moves only as the fraction does, so reduce motion has nothing to gate.
 */
export function DownloadRing({ size, fraction }: DownloadRingProps) {
  const accent = useTokenColor("primary");
  const track = usePalette()["fill-3"];
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const drawn = fraction === undefined ? 0 : (fraction ?? UNKNOWN_FRACTION);
  const centre = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={centre}
        cy={centre}
        r={radius}
        stroke={track}
        strokeWidth={STROKE}
        fill="none"
      />
      {drawn > 0 ? (
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={[circumference * drawn, circumference]}
          fill="none"
          rotation={-90}
          origin={`${centre}, ${centre}`}
        />
      ) : null}
    </Svg>
  );
}

/** The transferring song's ring; mounted only while it is, so it alone follows the progress. */
function ActiveMark({ id }: { id: string }) {
  const fraction = useSongProgress(id);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Downloading"
      accessibilityValue={
        fraction === null
          ? undefined
          : { min: 0, max: 100, now: Math.round(fraction * 100) }
      }
    >
      <DownloadRing size={iconSize.md} fraction={fraction} />
    </View>
  );
}

/**
 * A song row's download state, beside its controls: a ring while it
 * transfers, a bare track while it waits its turn, nothing otherwise. It is
 * a status, not a control, so it is smaller than a touch target. One store
 * selector per row, so only the rows whose own state changes re-render.
 */
export function DownloadMark({ id }: { id: string }) {
  const state = useSongDownload(id);
  if (state === "active") return <ActiveMark id={id} />;
  if (state === "queued") {
    return (
      <View
        accessible
        accessibilityLabel="Waiting to download"
        className="opacity-60"
      >
        <DownloadRing size={iconSize.md} />
      </View>
    );
  }
  return null;
}
