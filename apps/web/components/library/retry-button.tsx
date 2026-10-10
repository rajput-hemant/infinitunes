"use client";

import { Button } from "@infinitunes/ui/components/button";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { controlStyles } from "~/lib/control-styles";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  return (
    <Button
      variant="secondary"
      className={controlStyles.text}
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RotateCw
        aria-hidden
        className={isPending ? "mr-1 size-4 animate-spin" : "mr-1 size-4"}
      />
      {isPending ? "Retrying…" : "Try Again"}
    </Button>
  );
}
