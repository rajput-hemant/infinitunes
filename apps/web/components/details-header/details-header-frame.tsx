"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { ToolbarTitle } from "./toolbar-title";
import { useToolbarArt } from "./use-toolbar-art";

type DetailsHeaderFrameProps = {
  title: string;
  className: string;
  children: ReactNode;
};

/**
 * The artwork band. It tells the toolbar above it that artwork is behind the
 * glass and that the heading has scrolled under it.
 */
export function DetailsHeaderFrame({
  title,
  className,
  children,
}: DetailsHeaderFrameProps) {
  const ref = useRef<HTMLElement>(null);
  useToolbarArt(ref);

  return (
    <>
      <figure ref={ref} className={className}>
        {children}
      </figure>
      <ToolbarTitle title={title} />
    </>
  );
}
