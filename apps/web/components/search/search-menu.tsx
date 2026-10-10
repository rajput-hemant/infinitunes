"use client";

import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@infinitunes/ui/components/dialog";
import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { useKeydown } from "~/hooks/use-keydown";
import { useIsTyping } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { api } from "~/lib/trpc/client";
import { cn, isMacOs } from "~/lib/utils";

import { SearchField } from "./search-field";
import { SearchPaletteBody } from "./search-palette-body";
import { resolveSearchState } from "./search-status";
import { searchUi } from "./search-ui";
import { useRecentSearches } from "./use-recent-searches";
import { useSearchPaletteKeys } from "./use-search-palette-keys";

const subscribeNever = () => () => {};

const LISTBOX_ID = "search-palette-listbox";

type SearchMenuProps = {
  className?: string;
  topSearch: React.ReactNode;
};

export function SearchMenu({ topSearch, className }: SearchMenuProps) {
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;
  if (openPath !== null && !isOpen) setOpenPath(null);
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const setIsOpen = (open: boolean) => {
    if (open) setQuery("");
    setOpenPath(open ? pathname : null);
  };

  const deferredQuery = useDeferredValue(query.trim());

  const [, setIsTyping] = useIsTyping();
  const { recent, add } = useRecentSearches();
  const { activeOptionId } = useSearchPaletteKeys({
    enabled: isOpen,
    listboxId: LISTBOX_ID,
    resetKey: deferredQuery,
  });

  useKeydown((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  });

  useEffect(() => {
    setIsTyping(isOpen);
  }, [isOpen, setIsTyping]);

  const { data, error } = api.search.all.useQuery(
    { q: deferredQuery },
    { enabled: deferredQuery.length > 0, retry: false },
  );

  const results = resolveSearchState(data, error);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Search"
            aria-keyshortcuts="Control+K Meta+K"
            className={cn(
              controlStyles.headerIcon,
              searchUi.trigger,
              className,
            )}
          >
            <Search aria-hidden="true" className="size-5 lg:size-4" />
            <span className="hidden flex-1 text-left lg:inline">Search</span>
            <kbd
              className={cn(
                searchUi.kbd,
                "pointer-events-none hidden lg:inline-grid",
              )}
            >
              {mounted && isMacOs() ? "⌘" : "Ctrl"} K
            </kbd>
          </Button>
        }
      />

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
              expanded: isOpen,
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
            query={deferredQuery}
            listboxId={LISTBOX_ID}
            results={results}
            recent={recent}
            topSearch={topSearch}
            onSelect={() => add(deferredQuery)}
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
