"use client";

import { Button } from "@infinitunes/ui/button";
import Image from "next/image";
import React from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center gap-4 lg:ml-[-16%]">
      <Image
        src="/images/searching-duck.gif"
        width={100}
        height={100}
        alt="Searching Duck"
        className="w-2h-28 h-28 object-cover drop-shadow-sm"
      />

      <h1 className="font-heading text-3xl drop-shadow-sm dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-4xl md:text-5xl">
        Something went wrong!
      </h1>
      <Button variant="outline" onClick={() => reset()} className="shadow-xs">
        Try again
      </Button>
    </div>
  );
}
