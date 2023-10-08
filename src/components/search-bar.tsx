"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useEventListener } from "@/hooks/use-event-listner";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

type Props = {
  className?: string;
};

function SearchMenu({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsOpen((isOpen) => !isOpen);
    }
  });

  return (
    <div className={className}>
      <Button
        variant="outline"
        className="h-10 w-10 p-0 lg:w-60 lg:justify-normal lg:px-3 lg:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 lg:mr-2" aria-hidden="true" />
        <span className="hidden lg:inline-flex">Search...</span>

        <span className="sr-only">Search</span>

        <kbd className="pointer-events-none ml-auto hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search..."
          value={query}
          onValueChange={setQuery}
        />

        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm">
            No results found.
          </CommandEmpty>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export default SearchMenu;
