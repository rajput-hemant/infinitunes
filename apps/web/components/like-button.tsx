"use client";

import { isFavoriteType } from "@infinitunes/core/favorites";
import type { Favorite } from "@infinitunes/db/schema";
import type { MediaType } from "@infinitunes/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Heart } from "lucide-react";
import React from "react";

import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { useFavoriteToggle } from "~/lib/use-favorite-toggle";
import { cn } from "~/lib/utils";

type LikeButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  user?: User;
  type: MediaType;
  name: string;
  token: string;
  /** `null` means the favorites read failed: state unknown, so no writes. */
  favourites?: Favorite | null;
};

export function LikeButton(props: LikeButtonProps) {
  const { user, type, token, name, favourites, className, ...rest } = props;

  const [popping, setPopping] = React.useState(false);
  // Types without a favorites column render nothing below; "song" only
  // keeps the hook's key well formed for them.
  const { liked: optimisticLike, toggle } = useFavoriteToggle({
    type: isFavoriteType(type) ? type : "song",
    token,
    name,
    user,
    favourites,
  });

  if (!isFavoriteType(type)) {
    return null;
  }

  function likeHandler() {
    if (toggle() && !optimisticLike) setPopping(true);
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label="Like"
        aria-pressed={optimisticLike}
        // Not `disabled`: on Base UI's trigger that only suppresses the
        // tooltip, not the button, and a native-disabled button would never
        // show why it is unavailable.
        aria-disabled={favourites === null}
        onClick={likeHandler}
        className={cn(
          controlStyles.rowIcon,
          "inline-flex items-center justify-center text-muted-foreground outline-hidden transition-colors duration-fast hover:bg-fill hover:text-foreground active:bg-fill-2 focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-40",
          className,
        )}
        {...rest}
      >
        <Heart
          aria-hidden
          className={cn(
            "size-4.5 transition-transform duration-fast ease-out active:scale-96",
            optimisticLike && "fill-primary text-primary",
            popping && optimisticLike && "motion-pop",
          )}
          onAnimationEnd={() => setPopping(false)}
        />
      </TooltipTrigger>

      <TooltipContent>
        {favourites === null
          ? "Couldn't load your favorites"
          : `${optimisticLike ? "Unlike" : "Like"} \`${name}\``}
      </TooltipContent>
    </Tooltip>
  );
}
