"use client";

import { Button } from "@infinitunes/ui/components/button";
import React from "react";

import { ErrorIllustration } from "~/components/error-illustration";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function Error({ error, retry }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <ErrorIllustration />

      <h1 className="font-heading text-3xl dark:drop-shadow-sm text-foreground sm:text-4xl md:text-5xl">
        Something went wrong!
      </h1>
      <Button variant="outline" onClick={() => retry()} className="shadow-xs">
        Try again
      </Button>
    </div>
  );
}
