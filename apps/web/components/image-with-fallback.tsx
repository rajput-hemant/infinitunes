"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";
import { useState } from "react";

import { isUpstreamPlaceholder } from "~/components/placeholder-src";
import { cn } from "~/lib/utils";

type ImageWithFallbackProps = ImageProps & {
  fallback: ImageProps["src"];
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { fallback, alt, src, className, onLoad, ...restProps } = props;

  const effectiveSrc = src && !isUpstreamPlaceholder(src) ? src : fallback;

  // Remember which `src` failed so a new `src` starts without an error.
  const [failedSrc, setFailedSrc] = useState<typeof effectiveSrc | null>(null);
  const error = failedSrc === effectiveSrc;
  if (failedSrc !== null && !error) setFailedSrc(null);

  return (
    <Image
      src={error ? fallback : effectiveSrc}
      alt={alt}
      onError={() => setFailedSrc(effectiveSrc)}
      // `data-loaded` lets the placeholder skeleton behind the image stop
      // pulsing (see globals.css): a pulse that never ends keeps the
      // compositor, and every glass backdrop over it, redrawing every frame.
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "true";
        onLoad?.(event);
      }}
      className={cn("rounded-md", className, error && "dark:invert")}
      {...restProps}
    />
  );
}
