"use client";

import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";

import { QueryScope } from "~/components/query-scope";
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "~/hooks/use-debounced-value";
import { controlStyles } from "~/lib/control-styles";
import { trpc } from "~/lib/trpc/vanilla";

import { SearchField } from "./search-field";
import { SearchPaletteBody } from "./search-palette-body";
import { resolveSearchState } from "./search-status";
import { searchUi } from "./search-ui";
import { useRecentSearches } from "./use-recent-searches";
import { useSearchPaletteKeys } from "./use-search-palette-keys";

const LISTBOX_ID = "search-palette-listbox";

type SearchPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topSearch: ReactNode;
};

/**
 * Closes the palette when the route changes. The pathname is read here, behind
 * its own `<Suspense>`, so the toolbar does not wait on it while a route with
 * request-time params prerenders.
 */
function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    onNavigate();
  }, [pathname, onNavigate]);

  return null;
}

/**
 * The search dialog, loaded on the first intent on the toolbar's search button
 * (see `SearchMenu`). It has no trigger of its own: the button in the toolbar
 * stays put and drives `open`.
 */
export function SearchPalette(props: SearchPaletteProps) {
  return (
    <QueryScope>
      <SearchPaletteDialog {...props} />
    </QueryScope>
  );
}

function SearchPaletteDialog({
  open,
  onOpenChange,
  topSearch,
}: SearchPaletteProps) {
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS, {
    immediate: "",
  });

  const { recent, add } = useRecentSearches();
  const { activeOptionId } = useSearchPaletteKeys({
    enabled: open,
    listboxId: LISTBOX_ID,
    resetKey: debouncedQuery,
  });

  const { data, error } = useQuery({
    queryKey: ["search-all", debouncedQuery],
    queryFn: () => trpc.search.all.query({ q: debouncedQuery }),
    enabled: debouncedQuery.length > 0,
    retry: false,
  });

  const results = resolveSearchState(data, error);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      // The field empties once the close animation is over, not while it plays.
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setQuery("");
      }}
    >
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={() => onOpenChange(false)} />
      </Suspense>

      <DialogContent
        data-search-palette
        data-glass-role="palette"
        showCloseButton={false}
        className="top-[12vh] flex max-h-[min(88dvh,100%)] translate-y-0 flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-160 max-md:inset-0 max-md:size-full max-md:max-h-none max-md:max-w-none max-md:translate-none max-md:rounded-none max-md:pt-[env(safe-area-inset-top)]"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        <div className="flex shrink-0 items-center border-b border-border pr-3">
          <SearchField
            variant="palette"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists, podcasts"
            className="min-w-0 flex-1"
            combobox={{
              listboxId: LISTBOX_ID,
              expanded: open,
              activeOptionId,
            }}
          />
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                aria-label="Close"
                className={controlStyles.headerIcon}
              />
            }
          >
            <X aria-hidden="true" className="size-4" />
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto md:max-h-[min(60vh,32rem)]">
          <SearchPaletteBody
            query={debouncedQuery}
            listboxId={LISTBOX_ID}
            results={results}
            recent={recent}
            topSearch={topSearch}
            onSelect={() => add(debouncedQuery)}
          />
        </div>

        <div className="hidden shrink-0 items-center gap-4 border-t border-border px-4 py-2 text-xs leading-4 text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1">
            <kbd className={searchUi.kbd}>↑</kbd>
            <kbd className={searchUi.kbd}>↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className={searchUi.kbd}>↵</kbd>
            open
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className={searchUi.kbd}>esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
