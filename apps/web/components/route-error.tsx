"use client";

import { Button } from "@infinitunes/ui/components/button";
import { RefreshCw } from "lucide-react";
import React from "react";

import { ErrorIllustration } from "~/components/error-illustration";
import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

export type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
  /** `screen` fills the viewport; `content` leaves room for the site header. */
  height: "screen" | "content";
};

const heightClassName: Record<RouteErrorProps["height"], string> = {
  screen: "min-h-dvh",
  content: "min-h-[calc(100dvh-14rem)]",
};

/**
 * A server render failure reaches the browser with its message stripped (React
 * production error #441); the real error is in the server log under the same
 * digest, so log that instead of the redacted placeholder.
 */
export function logRouteError(error: Error & { digest?: string }) {
  if (error.digest) {
    console.error(`Route failed on the server (digest ${error.digest})`);
  } else {
    console.error(error);
  }
}

export function RouteError(props: RouteErrorProps) {
  const { error, retry, height } = props;

  React.useEffect(() => {
    logRouteError(error);
  }, [error]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4",
        heightClassName[height],
      )}
    >
      <GlassSurface
        size="l"
        lens="off"
        className="flex w-full max-w-88 flex-col items-center gap-3 rounded-(--radius) p-8 text-center"
      >
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
      </GlassSurface>
    </div>
  );
}
