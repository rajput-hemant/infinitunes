"use client";

import { Heart } from "lucide-react";

type Props = {
  className?: string;
};

export const LikeButton = ({ className }: Props) => {
  function likeHandler() {
    // ...
  }

  return (
    <button onClick={likeHandler} className={className}>
      <Heart className="size-full text-inherit" />
    </button>
  );
};
