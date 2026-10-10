import { buttonVariants } from "@infinitunes/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@infinitunes/ui/components/empty";
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import React from "react";

import { controlStyles } from "~/lib/control-styles";
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
        <Heading className="font-heading text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">
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
  tone?: "default" | "error";
  className?: string;
  children?: React.ReactNode;
};

export function LibraryState(props: LibraryStateProps) {
  const {
    icon: Icon,
    title,
    titleAs: Title = "h3",
    description,
    tone = "default",
    className,
    children,
  } = props;

  return (
    <Empty
      className={cn(
        "flex-none animate-in gap-2 rounded-md border border-dashed px-4 py-12 duration-base ease-spring fade-in slide-in-from-bottom-1",
        className,
      )}
    >
      <EmptyHeader className="items-center gap-2">
        <EmptyMedia
          variant="icon"
          className={cn(
            "mb-0 size-12 rounded-full bg-fill text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
            tone === "error" && "text-destructive",
          )}
        >
          <Icon aria-hidden />
        </EmptyMedia>

        <Title className="font-heading text-base font-bold tracking-tight text-balance">
          {title}
        </Title>

        <EmptyDescription className="max-w-88 text-pretty">
          {description}
        </EmptyDescription>
      </EmptyHeader>

      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
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
        <Link
          href={action.href}
          className={buttonVariants({
            variant: "secondary",
            className: controlStyles.text,
          })}
        >
          {action.label}
        </Link>
      )}

      {children}
    </LibraryState>
  );
}

export function LibraryUnavailable({ what }: { what: string }) {
  return (
    <output className="block">
      <LibraryState
        icon={TriangleAlert}
        tone="error"
        title={`Couldn’t load your ${what}`}
        description="Your saved items are safe. We couldn’t load them from the music service. Try again in a moment."
      >
        <RetryButton />
      </LibraryState>
    </output>
  );
}
