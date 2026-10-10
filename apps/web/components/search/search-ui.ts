/** Shared class strings for search surfaces (palette-ready, no glass). */
export const searchUi = {
  searchbox:
    "flex items-center gap-2 rounded-(--r-ctl) bg-fill text-muted-foreground transition-colors duration-fast hover:bg-fill-2",
  searchboxLg: "h-(--ctl-lg) w-full px-2.5",
  searchboxTrigger:
    "justify-center px-0 hover:bg-fill lg:h-(--ctl-lg) lg:w-60 lg:justify-start lg:px-2.5 lg:text-sm",
  chip: "inline-flex h-(--ctl) flex-none items-center gap-1.5 rounded-(--r-ctl) bg-fill px-3.5 text-xs font-medium whitespace-nowrap transition-[background-color,transform] duration-fast hover:bg-fill-2 active:scale-[0.96] motion-reduce:active:scale-100",
  chipActive: "bg-foreground text-background hover:bg-foreground",
  chipsRow:
    "-mx-0.5 flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  sectionHeader:
    "mb-3 flex items-center justify-between gap-4 font-heading text-lg font-bold tracking-tight text-foreground",
  groupLabel:
    "flex items-center justify-between px-2.5 pt-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground",
  paletteRow:
    "flex w-full items-center gap-3 rounded-sm px-2.5 py-1.5 text-left transition-colors duration-fast hover:bg-fill-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
  paletteRowSelected: "bg-fill-2",
  paletteArt:
    "relative size-9 shrink-0 overflow-hidden rounded-[calc(var(--r-sm)*0.75)] border border-border bg-fill",
  paletteArtRound: "rounded-full",
  kbd: "rounded-sm bg-card px-1.5 py-0.5 font-medium text-[0.6875rem] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]",
  pageTitle:
    "font-heading text-[clamp(1.625rem,2.6vw,2.125rem)] font-bold leading-none tracking-tight text-foreground",
} as const;
