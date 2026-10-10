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

  // Remember which `src` failed so a new `src` starts without an error.
  const [failedSrc, setFailedSrc] = React.useState<typeof src | null>(null);
  const error = failedSrc === src;
  if (failedSrc !== null && !error) setFailedSrc(null);

  return (
    <Image
      src={error ? fallback : src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={cn(className, error && "dark:invert")}
      {...restProps}
    />
  );
}
