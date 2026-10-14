"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

type RenderWithPathname = (pathname: string | null) => ReactNode;

function ResolvedPathname({ render }: { render: RenderWithPathname }) {
  return render(usePathname());
}

/**
 * `usePathname()` suspends while a route whose params are only known at request
 * time is prerendered, which would postpone everything above the hook. Render
 * the pathname-aware UI through this boundary: that route's shell gets the same
 * UI with `null` (nothing active) and the real pathname streams in; routes with
 * known paths and every client navigation resolve it at once.
 */
export function PathnameBoundary({ render }: { render: RenderWithPathname }) {
  return (
    <Suspense fallback={render(null)}>
      <ResolvedPathname render={render} />
    </Suspense>
  );
}
