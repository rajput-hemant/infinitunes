"use client";

import { Button } from "@infinitunes/ui/components/button";
import { Search } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";
import { useIsHydrated } from "~/hooks/use-is-hydrated";
import { useKeydown } from "~/hooks/use-keydown";
import { useIsTyping } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn, isMacOs } from "~/lib/utils";

import { searchUi } from "./search-ui";

type SearchMenuProps = {
  className?: string;
  topSearch: ReactNode;
};

const loadPalette = () => import("./search-palette");

/**
 * The toolbar's search button. The dialog behind it (Base UI Dialog, the
 * query stack, the result rows) is a separate chunk: hover, focus, pointer
 * down or Ctrl/Cmd+K starts loading it, and it mounts once it has arrived. A
 * click before that opens it as soon as it lands.
 */
export function SearchMenu({ topSearch, className }: SearchMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const mounted = useIsHydrated();
  const { mod, preload, intent } = useDeferred("search", loadPalette);

  const [, setIsTyping] = useIsTyping();

  useKeydown((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      preload();
      setOpen(!isOpen);
    }
  });

  useEffect(() => {
    setIsTyping(isOpen);
  }, [isOpen, setIsTyping]);

  const Palette = mod?.SearchPalette;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        aria-label="Search"
        aria-keyshortcuts="Control+K Meta+K"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-slot="dialog-trigger"
        data-popup-open={isOpen ? "" : undefined}
        data-deferred="search"
        {...intent}
        onClick={() => {
          preload();
          setOpen(true);
        }}
        className={cn(controlStyles.headerIcon, searchUi.trigger, className)}
      >
        <Search aria-hidden="true" className="size-5 lg:size-4" />
        <span className="hidden flex-1 text-left lg:inline">Search</span>
        <kbd
          className={cn(
            searchUi.kbd,
            // On glass the key cap is a translucent fill, never the opaque card colour.
            "pointer-events-none hidden bg-fill inset-ring-0 lg:inline-grid",
          )}
        >
          {mounted && isMacOs() ? "⌘" : "Ctrl"} K
        </kbd>
      </Button>

      {Palette ? (
        <Palette open={isOpen} onOpenChange={setOpen} topSearch={topSearch} />
      ) : null}
    </>
  );
}
