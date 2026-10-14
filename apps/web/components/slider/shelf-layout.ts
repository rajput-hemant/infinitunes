import { cn } from "~/lib/utils";

/**
 * Layout classes of a `Shelf` and its `ShelfItem`s. The shelf is a client
 * component; the skeleton is not, so both read these from here and the
 * placeholder lands on the real card widths and gaps.
 */
export function shelfListClassName(rows: 1 | 2 = 1) {
  return cn(
    "grid auto-cols-max grid-flow-col gap-3 overflow-x-auto p-1 scroll-smooth snap-x snap-mandatory md:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    rows === 2 && "grid-rows-2",
  );
}

export const shelfItemClassName =
  "w-[40vw] min-w-0 snap-start md:w-40 xl:w-44 min-[120rem]:w-48 min-[160rem]:w-52";
