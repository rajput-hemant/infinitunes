"use client";

import { Button } from "@infinitunes/ui/components/button";
import { RefreshCw } from "lucide-react";
import React from "react";

import { ErrorIllustration } from "~/components/error-illustration";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function RouteError({ error, retry }: ErrorProps) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-88 flex-col items-center gap-3 rounded-(--radius) border border-dashed border-border p-8 text-center">
        <ErrorIllustration />

        <h1 className="font-heading text-xl font-bold leading-7 text-foreground">
          Something went wrong!
        </h1>

        <p className="text-sm leading-5 text-muted-foreground">
          We could not load this section. Check your connection and try again.
        </p>

        <Button
          variant="outline"
          onClick={() => retry()}
          className={cn(controlStyles.text, "mt-2")}
        >
          <RefreshCw className="mr-2 size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
