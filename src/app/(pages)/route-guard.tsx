"use client";

import { notFound, usePathname } from "next/navigation";

const RouteGuard = () => {
  const [, route, name, token] = usePathname().split("/");

  const excludedRoutes = ["me", "settings"];

  if (excludedRoutes.includes(route)) return null;

  if (name && !token) return notFound();
};

export default RouteGuard;
