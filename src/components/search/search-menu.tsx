"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import type { AllSearch } from "@/types";
import { searchAll } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useEventListener } from "@/hooks/use-event-listner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import SearchAll from "./search-all";

type Props = {
  topSearch: React.JSX.Element;
  className?: string;
};

function SearchMenu({ topSearch, className }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 1000);

  const [searchResult, setSearchResult] = useState<AllSearch | null>(null);

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen((isOpen) => !isOpen);
    }
  });

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

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
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex h-10 w-10 p-0 lg:w-60 lg:justify-start lg:px-3 lg:py-2",
            className
          )}
        >
          <Search className="inline-block h-4 w-4 lg:mr-2" aria-hidden="true" />
          <span className="sr-only">Search</span>

          <span className="hidden lg:inline-block">Search...</span>

          <kbd className="bg-muted pointer-events-none ml-auto hidden h-6 select-none items-center rounded border px-1.5 font-mono text-[10px] font-medium lg:block">
            <span className="text-xs">Ctrl</span> K
          </kbd>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-7xl shadow-lg">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {!debouncedQuery.length && topSearch}

        {isLoading && (
          <div className="text-muted-foreground mx-auto text-xs">
            <Loader2 className="mr-2 inline-block animate-spin" /> Loading
            Results
          </div>
        )}

        {searchResult && <SearchAll query={query} data={searchResult} />}
      </DialogContent>
    </Dialog>
  );
}

export default SearchMenu;
