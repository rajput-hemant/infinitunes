import type { MediaType } from "@infinitunes/types";
import { Play } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { PlayButton } from "./play-button";

type CardPlayProps = {
  /** Decoded title; names the control "Play <title>". */
  name: string;
  type: MediaType;
  token: string;
  /** Circular artwork: the button sits in the centre, inside the circle. */
  round?: boolean;
  /** The card root must carry the `group` class: it drives the reveal. */
  className?: string;
};

const reveal =
  "group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100";

/**
 * Play control over a card's artwork. It is a sibling of the card's link, never
 * a child of it (no button inside an anchor), and sits above the link's
 * stretched hit area, so a click plays and never navigates. Square art shows it
 * bottom right; round art centres it, because the bottom right corner of a
 * circle is outside the circle. Both show on hover or focus with a fine pointer
 * and stay visible on touch, where a tap on the button plays and a tap anywhere
 * else opens the page.
 */
export function CardPlay(props: CardPlayProps) {
  const { name, type, token, round = false, className } = props;

  return (
    <PlayButton
      aria-label={`Play ${name}`}
      type={type}
      token={token}
      data-card-play={round ? "round" : "square"}
      className={cn(
        controlStyles.cardPlay,
        "absolute z-20 flex items-center justify-center bg-primary text-primary-foreground shadow-md transition duration-base ease-spring motion-reduce:transition-none",
        reveal,
        round
          ? "inset-0 m-auto pointer-fine:scale-90 pointer-fine:opacity-0"
          : "right-2 bottom-2 pointer-fine:translate-y-1.5 pointer-fine:scale-90 pointer-fine:opacity-0",
        className,
      )}
    >
      <Play aria-hidden="true" className="size-4 fill-current" />
    </PlayButton>
  );
}
