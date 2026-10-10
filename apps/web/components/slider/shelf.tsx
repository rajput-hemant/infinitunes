"use client";

import { Button } from "@infinitunes/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type ShelfProps = {
  children: ReactNode;
  rows?: 1 | 2;
  className?: string;
};

/** Horizontal snap scroller of `ShelfItem`s with prev and next arrows on fine pointers. */
export function Shelf({ children, rows = 1, className }: ShelfProps) {
  const scroller = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const update = () =>
      setEdges({
        atStart: el.scrollLeft <= 0,
        atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      });

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function page(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8 });
  }

  return (
    <div className={cn("relative", className)}>
      <ol
        ref={scroller}
        className={cn(
          "grid auto-cols-max grid-flow-col gap-3 overflow-x-auto p-1 scroll-smooth snap-x snap-mandatory md:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          rows === 2 && "grid-rows-2",
        )}
      >
        {children}
      </ol>

      <Button
        type="button"
        variant="secondary"
        aria-label="Scroll left"
        disabled={edges.atStart}
        onClick={() => page(-1)}
        className={cn(
          controlStyles.headerIcon,
          "absolute top-1/2 left-1 z-20 hidden -translate-y-1/2 bg-card text-foreground shadow-md pointer-fine:flex disabled:invisible",
        )}
      >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        variant="secondary"
        aria-label="Scroll right"
        disabled={edges.atEnd}
        onClick={() => page(1)}
        className={cn(
          controlStyles.headerIcon,
          "absolute top-1/2 right-1 z-20 hidden -translate-y-1/2 bg-card text-foreground shadow-md pointer-fine:flex disabled:invisible",
        )}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
