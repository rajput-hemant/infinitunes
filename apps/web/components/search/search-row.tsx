import { decode, getImageSrc } from "@infinitunes/types";
import type { MediaType } from "@infinitunes/types";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { cn } from "~/lib/utils";

import { searchUi } from "./search-ui";

type SearchRowVisual =
  | { kind: "image"; src: string; type: MediaType }
  | { kind: "icon"; icon: LucideIcon };

type SearchRowProps = {
  href: Route;
  title: string;
  subtitle?: string;
  visual: SearchRowVisual;
  round?: boolean;
  /** Marks the row as a listbox option that the palette keyboard hook can select. */
  option?: boolean;
  onSelect?: () => void;
};

export function SearchRow(props: SearchRowProps) {
  const { href, title, subtitle, visual, round, option, onSelect } = props;

  return (
    <Link
      href={href}
      onClick={onSelect}
      {...(option && { role: "option", "data-search-option": "" })}
      className={searchUi.row}
    >
      <span className={cn(searchUi.art, round && searchUi.artRound)}>
        {visual.kind === "image" ? (
          <ImageWithFallback
            src={getImageSrc(visual.src, "low")}
            alt=""
            fill
            sizes="40px"
            fallback={getPlaceholderSrc(visual.type)}
            className={cn(
              "object-cover",
              visual.src.includes("default") && "dark:invert",
            )}
          />
        ) : (
          <visual.icon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm leading-5 font-medium">
          {decode(title)}
        </span>
        {subtitle ? (
          <span className="block truncate text-xs leading-4 text-muted-foreground">
            {decode(subtitle)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
