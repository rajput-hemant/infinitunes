"use client";

import type { RouteErrorProps } from "~/components/route-error";
import { RouteError } from "~/components/route-error";

export default function RootError(props: Omit<RouteErrorProps, "height">) {
  return <RouteError {...props} height="content" />;
}
