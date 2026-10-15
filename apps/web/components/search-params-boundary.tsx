"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import type { ReactNode } from "react";

import { clearPendingParam, usePendingParams } from "~/lib/pending-params";

type RenderWithParams = (params: URLSearchParams | null) => ReactNode;

function ResolvedParams({ render }: { render: RenderWithParams }) {
  return render(useSearchParams());
}

/**
 * `useSearchParams()` suspends while a route is prerendered, because the query
 * string is only known per request. Render query-aware UI (a selected chip, a
 * heading that names the language) through this boundary: the static shell gets
 * the same UI with `null` params and the real value takes over on arrival; on a
 * client navigation the params are already known, so it resolves at once.
 */
export function SearchParamsBoundary({ render }: { render: RenderWithParams }) {
  return (
    <Suspense fallback={render(null)}>
      <ResolvedParams render={render} />
    </Suspense>
  );
}

type KeyedByParamsProps = {
  /** Query parameters whose values identify the content below. */
  params: readonly string[];
  fallback: ReactNode;
  children: ReactNode;
};

function KeyedContent({ params, fallback, children }: KeyedByParamsProps) {
  const search = useSearchParams();
  const key = params.map((name) => search.get(name) ?? "").join("|");
  const pending = usePendingParams();
  const requested = params.filter((name) => pending.has(name));
  // A chip was clicked and the URL has not followed yet: show the skeleton now.
  const waiting = requested.some(
    (name) => pending.get(name) !== (search.get(name) ?? ""),
  );

  useEffect(() => {
    for (const name of requested) {
      if (pending.get(name) === (search.get(name) ?? ""))
        clearPendingParam(name);
    }
  }, [requested, pending, search]);

  if (waiting) return fallback;

  // A new key is a new boundary, so React shows `fallback` at once instead of
  // holding the previous list on screen (and the old URL) until the data lands.
  return (
    <Suspense key={key} fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Wraps content fetched for the current query string (`?lang=`, `?cat=`). When
 * the query changes, only this part shows its skeleton while the rest of the
 * page, which does not depend on it, stays put.
 */
export function KeyedByParams(props: KeyedByParamsProps) {
  return (
    <Suspense fallback={props.fallback}>
      <KeyedContent {...props} />
    </Suspense>
  );
}
