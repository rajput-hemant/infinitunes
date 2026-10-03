import { buttonVariants } from "@infinitunes/ui/components/button";
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import React from "react";

import { cn } from "~/lib/utils";

import { RetryButton } from "./retry-button";

type LibraryHeadingProps = {
  title: string;
  count?: number;
  noun?: string;
  children?: React.ReactNode;
};

export function LibraryHeading(props: LibraryHeadingProps) {
  const { title, count, noun, children } = props;

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="font-heading text-xl text-balance drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          {title}
        </h2>

        {count !== undefined && noun && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {count} {count === 1 ? noun : `${noun}s`}
          </p>
        )}
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

type LibraryStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
};

function LibraryState(props: LibraryStateProps) {
  const { icon: Icon, title, description, className, children } = props;

  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center lg:min-h-96",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-7" />
      </span>

      <h3 className="font-heading text-xl text-balance sm:text-2xl">{title}</h3>

      <p className="max-w-md text-pretty text-sm text-muted-foreground">
        {description}
      </p>

      {children}
    </div>
  );
}

type LibraryEmptyProps = Omit<LibraryStateProps, "children"> & {
  action?: { href: Route; label: string };
  children?: React.ReactNode;
};

export function LibraryEmpty(props: LibraryEmptyProps) {
  const { action, children, ...rest } = props;

  return (
    <LibraryState {...rest}>
      {action && (
        <Link href={action.href} className={buttonVariants({ size: "sm" })}>
          {action.label}
        </Link>
      )}

      {children}
    </LibraryState>
  );
}

export function LibraryUnavailable({ what }: { what: string }) {
  return (
    <div role="alert">
      <LibraryState
        icon={TriangleAlert}
        title={`Couldn’t load your ${what}`}
        description="Your saved items are safe. The music service didn’t respond, so try again in a moment."
      >
        <RetryButton />
      </LibraryState>
    </div>
  );
}
