"use client";

import { Input } from "@infinitunes/ui/components/input";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { searchUi } from "./search-ui";

type SearchFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  size?: "default" | "lg";
  combobox?: boolean;
  listboxId?: string;
};

export function SearchField(props: SearchFieldProps) {
  const {
    className,
    size = "default",
    combobox,
    listboxId,
    ...inputProps
  } = props;

  return (
    <div
      className={cn(
        searchUi.searchbox,
        size === "lg" && searchUi.searchboxLg,
        size === "default" && "h-(--ctl-lg)",
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <Input
        type="search"
        {...inputProps}
        role={combobox ? "combobox" : undefined}
        aria-expanded={combobox ? inputProps["aria-expanded"] : undefined}
        aria-controls={combobox ? listboxId : undefined}
        aria-autocomplete={combobox ? "list" : undefined}
        className="h-full flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
