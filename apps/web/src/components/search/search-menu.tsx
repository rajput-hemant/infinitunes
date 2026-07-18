"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import type { AllSearch } from "@/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEventListener } from "@/hooks/use-event-listner";
import { useIsTyping } from "@/hooks/use-store";
import { searchAll } from "@/lib/jiosaavn-api";
import { cn, isMacOs } from "@/lib/utils";
import { SearchAll } from "./search-all";

type SearchMenuProps = {
  className?: string;
  topSearch: React.ReactNode;
};

export function SearchMenu({ topSearch, className }: SearchMenuProps) {
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AllSearch | null>(null);

  const debouncedQuery = useDebounce(query.trim(), 1000);

  const [_, setIsTyping] = useIsTyping();

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen((isOpen) => !isOpen);
    }
  });

  useEffect(() => {
    if (isOpen) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
      setQuery("");
    }
  }, [isOpen, setIsTyping]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      if (!debouncedQuery) return setSearchResult(null);
      setIsLoading(true);
      const data = await searchAll(debouncedQuery);
      setIsLoading(false);
      setSearchResult(data);
    })();
  }, [debouncedQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "flex size-10 p-0 shadow-sm lg:w-60 lg:justify-start lg:px-3 lg:py-2",
            className
          )}
        >
          <Search aria-hidden="true" className="inline-block size-4 lg:mr-2" />
          <span className="sr-only">Search</span>

          <span className="hidden lg:inline-block">Search...</span>

          <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:block">
            <span className="text-xs">{isMacOs() ? "⌘" : "Ctrl"}</span> K
          </kbd>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-7xl shadow-md">
        <div className="relative mr-4 mt-4">
          <Search className="absolute left-2 top-3 size-4 text-muted-foreground" />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-8"
          />
        </div>

        {debouncedQuery.length ?
          isLoading ?
            <div className="m-auto aspect-square h-16 animate-spin rounded-full border-y-2 border-primary py-10 lg:h-32">
              <span className="sr-only">Loading Results</span>
            </div>
          : searchResult && <SearchAll query={query} data={searchResult} />
        : topSearch}
      </DialogContent>
    </Dialog>
  );
}
