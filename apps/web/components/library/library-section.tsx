import { buttonVariants } from "@infinitunes/ui/components/button";
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import React from "react";

import { cn } from "~/lib/utils";

import { RetryButton } from "./retry-button";

type LibraryHeadingProps = {
  title: React.ReactNode;
  as?: "h1" | "h2";
  count?: number;
  noun?: string;
  description?: string;
  missing?: number;
  className?: string;
  children?: React.ReactNode;
};

export function LibraryHeading(props: LibraryHeadingProps) {
  const {
    title,
    as: Heading = "h2",
    count,
    noun,
    description,
    missing,
    className,
    children,
  } = props;

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="font-heading text-xl text-balance drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
          {title}
        </Heading>

        {count !== undefined && noun && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {count} {count === 1 ? noun : `${noun}s`}
          </p>
        )}

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {missing !== undefined && missing > 0 && (
          <p className="text-sm text-muted-foreground">
            {missing} {missing === 1 ? "item" : "items"} couldn’t load. Refresh
            to try again.
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
  titleAs?: "h3" | "p";
  description: string;
  className?: string;
  children?: React.ReactNode;
};

export function LibraryState(props: LibraryStateProps) {
  const {
    icon: Icon,
    title,
    titleAs: Title = "h3",
    description,
    className,
    children,
  } = props;

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

      <Title className="font-heading text-xl text-balance sm:text-2xl">
        {title}
      </Title>

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
        description="Your saved items are safe. We couldn’t load them from the music service. Try again in a moment."
      >
        <RetryButton />
      </LibraryState>
    </div>
  );
}
