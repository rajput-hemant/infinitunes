"use client";

import type { AllSearch } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@infinitunes/ui/components/dialog";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

import LoadingSpinner from "~/components/loading-spinner";
import { useKeydown } from "~/hooks/use-keydown";
import { useIsTyping } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { api } from "~/lib/trpc/client";
import { asRoute, cn, isMacOs } from "~/lib/utils";

import { SearchAll } from "./search-all";
import { SearchField } from "./search-field";
import { searchUi } from "./search-ui";
import { useSearchPaletteKeys } from "./use-search-palette-keys";

const subscribeNever = () => () => {};

const LISTBOX_ID = "search-palette-listbox";

type SearchMenuProps = {
  className?: string;
  topSearch: React.ReactNode;
};

export function SearchMenu({ topSearch, className }: SearchMenuProps) {
  const pathname = usePathname();
  const dialogTitleId = useId();

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

  const [_, setIsTyping] = useIsTyping();

  const { resetSelection } = useSearchPaletteKeys(isOpen, LISTBOX_ID);

  useKeydown((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  });

  useEffect(() => {
    setIsTyping(isOpen);
  }, [isOpen, setIsTyping]);

  useEffect(() => {
    resetSelection();
  }, [deferredQuery, resetSelection]);

  const { data: searchResult, isLoading } = api.search.all.useQuery(
    { q: deferredQuery },
    { enabled: deferredQuery.length > 0 },
  );

  const result = searchResult as AllSearch | undefined;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Search"
            className={cn(
              searchUi.searchbox,
              searchUi.searchboxTrigger,
              "shadow-none",
              className,
              controlStyles.headerIcon,
            )}
          >
            <Search aria-hidden="true" className="size-4 lg:mr-0.5" />
            <span className="hidden flex-1 text-left lg:inline">
              Songs, albums, artists...
            </span>
            <kbd
              className={cn(
                searchUi.kbd,
                "pointer-events-none ml-auto hidden lg:inline-flex",
              )}
            >
              {mounted && isMacOs() ? "⌘" : "Ctrl"} K
            </kbd>
          </Button>
        }
      />

      <DialogContent
        data-search-palette
        className="flex max-h-[min(88dvh,100%)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        aria-labelledby={dialogTitleId}
      >
        <DialogTitle id={dialogTitleId} className="sr-only">
          Search
        </DialogTitle>

        <div className="shrink-0 border-b border-border px-4 py-2">
          <SearchField
            size="lg"
            combobox
            listboxId={LISTBOX_ID}
            aria-expanded={isOpen}
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists, podcasts"
            className="w-full"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {deferredQuery.length ? (
            isLoading ? (
              <LoadingSpinner size="sm" className="py-12" />
            ) : result ? (
              <SearchAll
                query={query}
                data={result}
                listboxId={LISTBOX_ID}
              />
            ) : null
          ) : (
            <div id={LISTBOX_ID} role="listbox" aria-label="Suggestions">
              {topSearch}
            </div>
          )}
        </div>

        <div className="hidden shrink-0 flex-wrap items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:flex">
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
          {deferredQuery.length > 0 ? (
            <Link
              href={asRoute(
                `/search/song/${encodeURIComponent(deferredQuery)}`,
              )}
              className="ml-auto text-primary hover:underline"
            >
              Open results page
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
