"use client";

import { Input } from "@infinitunes/ui/components/input";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { searchUi } from "./search-ui";

type SearchComboboxProps = {
  listboxId: string;
  expanded: boolean;
  activeOptionId?: string;
};

type SearchFieldProps = Omit<ComponentProps<typeof Input>, "type" | "role"> & {
  variant?: "page" | "palette";
  /** Turns the input into the combobox that drives a listbox; the input keeps focus. */
  combobox?: SearchComboboxProps;
};

export function SearchField(props: SearchFieldProps) {
  const { className, variant = "page", combobox, ...inputProps } = props;
  const isPalette = variant === "palette";

  return (
    <div
      className={cn(
        isPalette ? searchUi.fieldPalette : searchUi.fieldPage,
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className={cn("shrink-0", isPalette ? "size-4.5" : "size-4")}
      />
      <Input
        type="search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        {...(combobox && {
          role: "combobox",
          "aria-expanded": combobox.expanded,
          "aria-controls": combobox.listboxId,
          "aria-autocomplete": "list",
          "aria-activedescendant": combobox.activeOptionId,
        })}
        {...inputProps}
        className={cn(searchUi.inputBare, isPalette && searchUi.inputPalette)}
      />
    </div>
  );
}
