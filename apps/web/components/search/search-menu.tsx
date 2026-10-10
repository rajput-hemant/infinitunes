"use client";

import type { AllSearch } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@infinitunes/ui/components/dialog";
import { Input } from "@infinitunes/ui/components/input";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { useKeydown } from "~/hooks/use-keydown";
import { useIsTyping } from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";
import { cn, isMacOs } from "~/lib/utils";

import { SearchAll } from "./search-all";

const subscribeNever = () => () => {};

type SearchMenuProps = {
  className?: string;
  topSearch: React.ReactNode;
};

export function SearchMenu({ topSearch, className }: SearchMenuProps) {
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  // The dialog is open for the path it was opened on, so navigating closes it.
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

  useKeydown((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  });

  useEffect(() => {
    setIsTyping(isOpen);
  }, [isOpen, setIsTyping]);

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
            size="sm"
            variant="outline"
            className={cn(
              "flex size-11 p-0 shadow-xs lg:h-10 lg:w-60 lg:justify-start lg:px-3 lg:py-2",
              className,
            )}
          >
            <Search
              aria-hidden="true"
              className="inline-block size-4 lg:mr-2"
            />
            <span className="sr-only">Search</span>

            <span className="hidden lg:inline-block">Search...</span>

            <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:block">
              <span className="text-xs">
                {mounted && isMacOs() ? "⌘" : "Ctrl"}
              </span>{" "}
              K
            </kbd>
          </Button>
        }
      />

      <DialogContent className="max-w-7xl shadow-md sm:max-w-7xl">
        <DialogTitle className="sr-only">Search</DialogTitle>

        <div className="relative mr-4 mt-4">
          <Search
            aria-hidden="true"
            className="absolute left-2 top-3 size-4 text-muted-foreground"
          />

          <Input
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-10 w-full pl-8"
          />
        </div>

        {deferredQuery.length ? (
          isLoading ? (
            <output className="m-auto block aspect-square h-16 animate-spin rounded-full border-y-2 border-primary py-10 lg:h-32">
              <span className="sr-only">Loading Results</span>
            </output>
          ) : (
            result && <SearchAll query={query} data={result} />
          )
        ) : (
          topSearch
        )}
      </DialogContent>
    </Dialog>
  );
}
