"use client";

import type { MegaMenu } from "@infinitunes/types";
import { cn } from "@infinitunes/ui/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";
import { controlStyles } from "~/lib/control-styles";

type MainNavProps = {
  megaMenu: MegaMenu;
  className?: string;
};

const loadPopup = () => import("./main-nav-popup");

/**
 * Class strings of the Base UI navigation menu parts that are visible while it
 * is closed, so the shell below renders the same boxes (a test pins them to
 * `navigationMenuTriggerStyle`).
 */
export const navTriggerClassName =
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted";

/**
 * The toolbar's catalog links. "Music" opens a mega menu (Base UI
 * NavigationMenu); that chunk loads on the first hover or focus and replaces
 * this identical closed markup. If the pointer is already on "Music" by then,
 * the menu opens straight away.
 */
export function MainNav({ className, megaMenu }: MainNavProps) {
  const { mod, preload, intent } = useDeferred("main-nav", loadPopup);
  const [overMusic, setOverMusic] = useState(false);

  if (mod) {
    return (
      <mod.MainNavPopup
        className={className}
        megaMenu={megaMenu}
        defaultOpen={overMusic}
      />
    );
  }

  return (
    <nav
      data-slot="navigation-menu"
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      onPointerEnter={intent.onPointerEnter}
    >
      <ul
        data-slot="navigation-menu-list"
        className="group flex flex-1 list-none items-center justify-center gap-0"
      >
        <li data-slot="navigation-menu-item" className="relative">
          <button
            type="button"
            aria-expanded={false}
            data-slot="navigation-menu-trigger"
            data-deferred="main-nav"
            className={cn(navTriggerClassName, "group", controlStyles.text)}
            onFocus={intent.onFocus}
            onPointerEnter={(event) => {
              intent.onPointerEnter(event);
              setOverMusic(true);
            }}
            onPointerLeave={() => setOverMusic(false)}
            onClick={() => {
              preload();
              setOverMusic(true);
            }}
          >
            Music{" "}
            <ChevronDownIcon
              aria-hidden="true"
              className="relative top-px ml-1 size-3 transition duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180 group-data-open/navigation-menu-trigger:rotate-180"
            />
          </button>
        </li>

        <li data-slot="navigation-menu-item" className="relative">
          {/* oxlint-disable-next-line next/no-html-link-for-pages -- the open menu renders this same plain Base UI link */}
          <a
            data-slot="navigation-menu-link"
            href="/show"
            className={cn(
              "flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 in-data-[slot=navigation-menu-content]:rounded-md data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted [&_svg:not([class*='size-'])]:size-4",
              navTriggerClassName,
              controlStyles.text,
            )}
          >
            Podcasts
          </a>
        </li>
      </ul>
    </nav>
  );
}
