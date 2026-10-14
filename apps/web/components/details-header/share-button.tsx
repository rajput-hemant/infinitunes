"use client";

import { Button } from "@infinitunes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Share2 } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";

import { ShareOptions } from "../share-options";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Share"
            size="icon"
            variant="ghost"
            className={controlStyles.headerIcon}
          >
            <Share2 aria-hidden="true" className="size-5" />
          </Button>
        }
      />

      <DropdownMenuContent align="start">
        <ShareOptions isDropDownItem title={title} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
