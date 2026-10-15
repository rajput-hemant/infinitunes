"use client";

import Link from "next/link";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { useHash } from "~/hooks/use-hash";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

import { settingsNavItems } from "./settings-nav-groups";

/** A section is current once its top has passed this fraction of the viewport height. */
const SPY_LINE = 0.35;

/** The section the viewport is reading: the last one whose top is above the line. */
function readActiveSection(): string | null {
  if (window.scrollY < 4) return null;
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 4;
  let current: string | null = null;
  for (const { id } of settingsNavItems) {
    const rect = document.getElementById(id)?.getBoundingClientRect();
    // A section filtered out by the search has no box. At the very bottom the
    // last section wins even though it is too short to reach the line.
    if (
      rect &&
      rect.height > 0 &&
      (atBottom || rect.top <= window.innerHeight * SPY_LINE)
    ) {
      current = id;
    }
  }
  return current;
}

/** The id of the section the viewport is reading, following the page as it scrolls. */
function useActiveSection() {
  const hash = useHash();
  const [spied, setSpied] = React.useState<string | null>(null);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSpied(readActiveSection()));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const fromHash = settingsNavItems.find((item) => item.id === hash)?.id;
  return spied ?? fromHash ?? settingsNavItems[0].id;
}

type RailListProps = {
  active: string;
  /** The side rail shows group labels and stacks; the chip row scrolls sideways. */
  stacked?: boolean;
};

function RailList({ active, stacked }: RailListProps) {
  return (
    <ul
      className={cn(
        stacked
          ? "grid gap-0.5"
          : "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {settingsNavItems.map((item, index) => {
        const current = item.id === active;
        const startsGroup =
          index === 0 || settingsNavItems[index - 1].group !== item.group;

        return (
          <li key={item.id} className={cn(!stacked && "contents")}>
            {stacked && startsGroup && (
              <p className="px-3 pt-4 pb-1 text-[0.6875rem]/4 font-semibold tracking-wider text-muted-foreground uppercase first:pt-0">
                {item.group}
              </p>
            )}
            <Link
              href={asRoute(`/settings#${item.id}`)}
              aria-current={current ? "location" : undefined}
              className={cn(
                controlStyles.text,
                "flex flex-none items-center gap-2 px-3 text-[0.8125rem]/5 font-medium whitespace-nowrap text-muted-foreground ease-spring transition-colors duration-fast hover:bg-fill hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-fill-2",
                stacked ? "w-full rounded-sm" : "rounded-full",
                current && "bg-fill-2 text-foreground hover:bg-fill-2",
              )}
            >
              <item.icon aria-hidden className="size-4 shrink-0" />
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The section rail: a sticky side list with group labels from `lg`, and a
 * glass chip row pinned under the toolbar below it.
 */
export function SettingsNav() {
  const active = useActiveSection();

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 lg:top-20">
      <GlassSurface
        size="s"
        render={<nav aria-label="Settings sections" />}
        className="rounded-full p-1 lg:hidden"
      >
        <RailList active={active} />
      </GlassSurface>

      <nav aria-label="Settings sections" className="hidden lg:block">
        <RailList active={active} stacked />
        <p className="mt-5 px-3 text-xs/4 text-muted-foreground">
          Changes apply as you make them. Appearance is saved in this browser.
        </p>
      </nav>
    </div>
  );
}
