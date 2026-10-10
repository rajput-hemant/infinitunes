/** Shared class strings for search surfaces. The palette shell stays plain so a glass layer can wrap it later. */
export const searchUi = {
  trigger:
    "flex items-center justify-center gap-2 bg-transparent px-0 text-foreground shadow-none transition-colors duration-fast hover:bg-fill-2 lg:h-(--ctl-lg) lg:w-64 lg:justify-start lg:bg-fill lg:px-3 lg:text-sm lg:text-muted-foreground xl:w-80",
  fieldPage:
    "flex h-10 w-full items-center gap-2 rounded-(--r-ctl) bg-fill px-3 text-muted-foreground transition-colors duration-fast focus-within:bg-fill-2 focus-within:ring-2 focus-within:ring-ring hover:bg-fill-2 pointer-coarse:h-12",
  fieldPalette:
    "flex h-13 w-full items-center gap-3 px-4 text-muted-foreground",
  inputBare:
    "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
  inputPalette: "text-base text-foreground md:text-base",
  kbd: "inline-grid h-5 min-w-5 place-items-center rounded-[calc(var(--r-sm)*0.5)] bg-card px-1 text-[0.6875rem] leading-4 font-medium text-muted-foreground inset-ring inset-ring-border",
  chipsRow:
    "-m-0.5 flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  chip: "inline-flex flex-none items-center gap-2 bg-fill px-3 text-[0.8125rem] leading-5 font-medium whitespace-nowrap transition-[background-color,transform] duration-fast hover:bg-fill-2 active:scale-[0.96] motion-reduce:active:scale-100",
  chipActive: "bg-foreground text-background hover:bg-foreground",
  pageTitle:
    "font-heading text-[1.75rem]/8 font-bold tracking-tight text-foreground md:text-[2rem]/10",
  sectionTitle:
    "font-heading text-xl leading-7 font-bold tracking-tight text-foreground",
  link: "text-[0.8125rem] leading-5 font-semibold text-primary hover:underline active:opacity-70",
  groupLabel:
    "px-2.5 pt-3 pb-1 text-[0.6875rem] leading-4 font-semibold tracking-wider text-muted-foreground uppercase",
  row: "flex min-h-12 w-full items-center gap-3 rounded-sm px-3 py-1 text-left transition-colors duration-fast outline-hidden hover:bg-fill-2 focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-fill-2",
  art: "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[calc(var(--r-sm)*0.75)] bg-fill",
  artRound: "rounded-full",
  panel: "rounded-md bg-card p-6 inset-ring inset-ring-border dark:bg-fill",
  grid: "grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] md:gap-x-4 xl:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] min-[1920px]:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] min-[2560px]:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]",
  gridCard: "w-full min-w-0",
} as const;
