import React from "react";

import { cn } from "~/lib/utils";

type SettingsSectionProps = {
  id: string;
  title: string;
  description?: React.ReactNode;
  /** A control for the whole section, set opposite the heading. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * One of the page's sections (a rail destination): a heading and the cards
 * under it. Hidden by CSS while a search leaves none of its rows.
 */
export function SettingsSection(props: SettingsSectionProps) {
  const { id, title, description, action, children, className } = props;
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "grid min-w-0 scroll-mt-28 grid-cols-[minmax(0,1fr)] gap-4 group-data-searching/settings:not-has-[[data-settings-row]:not([hidden])]:hidden lg:scroll-mt-16",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
          <h2
            id={headingId}
            className="font-heading text-xl/7 font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          {description && (
            <p className="text-sm/5 text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}
