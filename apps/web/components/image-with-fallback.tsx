"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";
import React from "react";

import { cn } from "~/lib/utils";

type ImageWithFallbackProps = ImageProps & {
  fallback: ImageProps["src"];
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { fallback, alt, src, className, ...restProps } = props;

  // If src is empty/undefined, use fallback immediately to avoid
  // "empty string passed to src" warnings.
  const effectiveSrc = src ? src : fallback;

  // Remember which `src` failed so a new `src` starts without an error.
  const [failedSrc, setFailedSrc] = React.useState<typeof effectiveSrc | null>(
    null,
  );
  const error = failedSrc === effectiveSrc;
  if (failedSrc !== null && !error) setFailedSrc(null);

  return (
    <Image
      src={error ? fallback : effectiveSrc}
      alt={alt}
      onError={() => setFailedSrc(effectiveSrc)}
      className={cn(className, error && "dark:invert")}
      {...restProps}
    />
  );
}
