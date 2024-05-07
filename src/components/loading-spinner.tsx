import React from "react";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = React.ComponentProps<"div"> & {
  size?: "sm" | "md" | "lg";
};

export default function LoadingSpinner(props: LoadingSpinnerProps) {
  const { size = "md", className, ...rest } = props;

  return (
    <div
      className={cn("grid size-full place-items-center", className)}
      {...rest}
    >
      <span className="sr-only">Loading...</span>
      <div
        className={cn(
          "aspect-square animate-spin rounded-full border-y-2 border-primary",
          {
            "h-8 lg:h-16": size === "sm",
            "h-16 lg:h-32": size === "md",
            "h-32 lg:h-64": size === "lg",
          }
        )}
      />
    </div>
  );
}
