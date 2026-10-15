import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

import { shelfItemClassName } from "./shelf-layout";

type ShelfItemProps = {
  children: ReactNode;
  className?: string;
};

/** One column of a `Shelf`. Its width is the shelf card width for the breakpoint. */
export function ShelfItem({ children, className }: ShelfItemProps) {
  return <li className={cn(shelfItemClassName, className)}>{children}</li>;
}
