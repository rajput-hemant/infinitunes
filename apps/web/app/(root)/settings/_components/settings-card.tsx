import React from "react";

import { cn } from "~/lib/utils";

type SettingsCardProps = {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  className?: string;
};

/**
 * A titled group of rows: plain surface, soft rim, hairline dividers. While
 * the settings search is active it hides itself when every row inside is
 * filtered out.
 */
export function SettingsCard(props: SettingsCardProps) {
  const { title, children, tone = "default", className } = props;

  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-line bg-card/70 group-data-searching/settings:not-has-[[data-settings-row]:not([hidden])]:hidden",
        tone === "danger" &&
          "border-destructive/30 bg-destructive/5 [&_[data-settings-row]]:border-destructive/20",
        className,
      )}
    >
      <h3
        className={cn(
          "px-4 pt-3.5 pb-1 text-xs/4 font-semibold tracking-wider text-muted-foreground uppercase",
          tone === "danger" && "text-destructive",
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/** A quiet strip under a card's rows: a hint on the left, an action on the right. */
export function SettingsCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs/4 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
