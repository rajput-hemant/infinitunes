import React from "react";

import { cn } from "~/lib/utils";

type SettingsSectionProps = {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection(props: SettingsSectionProps) {
  const { id, title, description, children, className } = props;
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("grid scroll-mt-20 gap-4", className)}
    >
      <div className="space-y-1">
        <h2
          id={headingId}
          className="font-heading text-xl/7 font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {children}
    </section>
  );
}
