"use client";

import type { RouteErrorProps } from "~/components/route-error";
import { RouteError } from "~/components/route-error";

export default function RouteSegmentError(
  props: Omit<RouteErrorProps, "height">,
) {
  return <RouteError {...props} height="content" />;
}
