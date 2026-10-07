"use client";

import { notFound, usePathname } from "next/navigation";
import type React from "react";
import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1025px)";

function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export default function SearchLayout({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

  if (pathname === "/search" && isDesktop) {
    return notFound();
  }

  return children;
}
