export const LABEL_TABS = ["songs", "albums"] as const;

export type LabelTab = (typeof LABEL_TABS)[number];

export const LABEL_TAB_LABELS: Record<LabelTab, string> = {
  songs: "Songs",
  albums: "Albums",
};
