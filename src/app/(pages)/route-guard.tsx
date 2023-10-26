"use client";

import { notFound, usePathname } from "next/navigation";

const RouteGuard = () => {
  const segments = usePathname().split("/");

  if (segments[2] && !segments[3]) return notFound();
};

export default RouteGuard;
