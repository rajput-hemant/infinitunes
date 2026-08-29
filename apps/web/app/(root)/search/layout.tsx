"use client";

import { notFound, usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function SearchLayout({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1025px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (pathname === "/search" && isDesktop) {
    return notFound();
  }

  return children;
}
