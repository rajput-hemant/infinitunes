"use client";

import { Button } from "@infinitunes/ui/components/button";
import { TriangleAlert } from "lucide-react";
import React from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function LibraryError({ error, retry }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center lg:min-h-96"
    >
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <TriangleAlert aria-hidden className="size-7" />
      </span>

      <h3 className="font-heading text-xl text-balance sm:text-2xl">
        Couldn’t load this section
      </h3>

      <p className="max-w-md text-pretty text-sm text-muted-foreground">
        Something went wrong while loading your library. Your saved items are
        safe, so try again.
      </p>

      <Button size="sm" variant="outline" onClick={() => retry()}>
        Try Again
      </Button>
    </div>
  );
}
