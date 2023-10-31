"use client";

import { Heart } from "lucide-react";

type Props = {
  className?: string;
};

const LikeButton = ({ className }: Props) => {
  function likeHandler() {
    // ...
  }

  return (
    <button onClick={likeHandler} className={className}>
      <Heart className="h-full w-full text-inherit" />
    </button>
  );
};

export default LikeButton;
