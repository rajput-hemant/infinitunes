"use client";

import { notFound, usePathname } from "next/navigation";

import type React from "react";

import { useWindowSize } from "@/hooks/use-window-size";

export default function SearchLayout({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const { width } = useWindowSize();

  if (pathname === "/search" && width > 1024) {
    return notFound();
  }

  return children;
}
