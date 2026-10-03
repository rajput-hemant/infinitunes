"use client";

import { Button } from "@infinitunes/ui/components/button";
import { TriangleAlert } from "lucide-react";
import React from "react";

import { LibraryState } from "~/components/library/library-section";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function LibraryError({ error, retry }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert">
      <LibraryState
        icon={TriangleAlert}
        title="Couldn’t load this section"
        description="Something went wrong while loading your library. Your saved items are safe, so try again."
      >
        <Button size="sm" variant="outline" onClick={() => retry()}>
          Try Again
        </Button>
      </LibraryState>
    </div>
  );
}
