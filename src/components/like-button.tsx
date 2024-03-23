"use client";

import { Heart } from "lucide-react";

import { currentlyInDev } from "@/lib/utils";

type LikeButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement>;

export function LikeButton(props: LikeButtonProps) {
  return (
    <button aria-label="Like" onClick={currentlyInDev} {...props}>
      <Heart className="size-5 text-inherit" />
    </button>
  );
}
