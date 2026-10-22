import { QUALITIES_MAP } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";

import { APPEARANCE_MODES } from "~/theme/appearance";
import { ACCENT_IDS, CORNER_STYLES } from "~/theme/tokens";
import type { CornerStyle } from "~/theme/tokens";

export const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const appearanceOptions = APPEARANCE_MODES.map((mode) => ({
  label: titleCase(mode),
  value: mode,
}));

export const accentOptions = ACCENT_IDS.map((id) => ({
  label: titleCase(id),
  value: id,
}));

export const cornerOptions = (Object.keys(CORNER_STYLES) as CornerStyle[]).map(
  (value) => ({ label: titleCase(value), value }),
);

export const qualityOptions = QUALITIES_MAP.map(({ quality, bitrate }) => ({
  label: bitrate.replace("kbps", " kbps"),
  value: quality,
}));

const IMAGE_QUALITIES = [
  "low",
  "medium",
  "high",
] as const satisfies readonly ImageQuality[];

export const imageQualityOptions = IMAGE_QUALITIES.map((value) => ({
  label: titleCase(value),
  value,
}));
