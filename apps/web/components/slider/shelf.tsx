"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { shelfListClassName } from "./shelf-layout";

type ShelfProps = {
  children: ReactNode;
  /** The section title (and subtitle); the scroll arrows sit at the right of this row. */
  heading?: ReactNode;
  rows?: 1 | 2;
  className?: string;
};

/** The list has 4px of padding, which the first snap point scrolls past: still the start. */
const START_SLACK = 6;

/** Horizontal snap scroller of `ShelfItem`s with prev and next arrows in its header row on fine pointers. */
export function Shelf({ children, heading, rows = 1, className }: ShelfProps) {
  const scroller = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const apply = () => {
      const atStart = el.scrollLeft <= START_SLACK;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      // Same edges as before: keep the state object so React skips the render.
      setEdges((prev) =>
        prev.atStart === atStart && prev.atEnd === atEnd
          ? prev
          : { atStart, atEnd },
      );
    };

    // Scroll fires faster than frames; read layout at most once per frame.
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    apply();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
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
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">{heading}</div>

        {/* Outside the track, in the header row, on the page surface: always legible. */}
        <div className="-my-0.5 ml-auto hidden shrink-0 gap-1 pointer-fine:flex">
          <ShelfArrow
            label="Scroll left"
            disabled={edges.atStart}
            onClick={() => page(-1)}
          >
            <ChevronLeft />
          </ShelfArrow>
          <ShelfArrow
            label="Scroll right"
            disabled={edges.atEnd}
            onClick={() => page(1)}
          >
            <ChevronRight />
          </ShelfArrow>
        </div>
      </div>

      <ol ref={scroller} className={shelfListClassName(rows)}>
        {children}
      </ol>
    </div>
  );
}

type ShelfArrowProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** Square icon control, the header icon size; dimmed (not hidden) at either end. */
function ShelfArrow(props: ShelfArrowProps) {
  const { label, disabled, onClick, children } = props;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        controlStyles.headerIcon,
        "flex items-center justify-center bg-fill text-foreground transition-colors duration-fast outline-none hover:bg-fill-2 focus-visible:ring-2 focus-visible:ring-ring active:bg-fill-3 disabled:opacity-35 disabled:hover:bg-fill motion-reduce:transition-none",
      )}
    >
      {children}
    </button>
  );
}
