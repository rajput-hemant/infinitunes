"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Share2 } from "lucide-react";

import { ShareOptions } from "../share-options";
import { headerIconClassName } from "./header-icon";

type ShareButtonProps = {
  title: string;
  /** The trigger's `data-deferred` name, so focus can follow the shell's swap. */
  name?: string;
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
};

/** Loaded with the header's popup chunk (`more-button-popup`), never statically. */
export function ShareButton({ title, name, defaultOpen }: ShareButtonProps) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger
        aria-label="Share"
        data-deferred={name}
        className={headerIconClassName}
      >
        <Share2 aria-hidden="true" className="size-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-auto min-w-48">
        <ShareOptions isDropDownItem title={title} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
