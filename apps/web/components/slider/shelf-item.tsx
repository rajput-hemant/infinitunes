import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/** One column of a `Shelf`. Its width is the shelf card width for the breakpoint. */
export function ShelfItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "w-[40vw] min-w-0 snap-start md:w-40 xl:w-44 min-[120rem]:w-48 min-[160rem]:w-52",
        className,
      )}
    >
      {children}
    </li>
  );
}
