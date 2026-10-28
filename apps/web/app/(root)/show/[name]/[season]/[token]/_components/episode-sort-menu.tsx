"use client";

import type { Sort } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { controlStyles } from "~/lib/control-styles";
import { pendingOnClick } from "~/lib/pending-params";
import { asRoute, cn } from "~/lib/utils";

const OPTIONS: { sort: Sort; label: string }[] = [
  { sort: "desc", label: "Newest" },
  { sort: "asc", label: "Oldest" },
];

/** `?sort=` menu: a pick tells `KeyedByParams` at click time, before the URL follows. */
export function EpisodeSortMenu({ sort }: { sort: Sort }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className={cn(controlStyles.text, "w-28 md:w-36")}
          >
            {sort === "asc" ? "Oldest" : "Newest"}
            <ChevronDown className="ml-auto size-5" />
          </Button>
        }
      />

      <DropdownMenuContent className="w-28 *:cursor-pointer md:w-36">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.sort}
            render={
              <Link
                href={asRoute(`?sort=${option.sort}`)}
                onClick={pendingOnClick("sort", option.sort)}
              >
                {option.label}
              </Link>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
