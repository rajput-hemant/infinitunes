import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

import {
  authInputStyles,
  authPrimaryButtonStyles,
  authSquareButtonStyles,
  authSquareLgButtonStyles,
} from "./_components/field-styles";

/** The control classes carry a `--fill` surface, so the placeholder tone overrides it in both themes. */
const tone = "bg-muted dark:bg-muted";

function FieldSkeleton() {
  return (
    <div className="grid gap-2">
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-16" />
      </div>
      <Skeleton className={cn(authInputStyles, tone)} />
    </div>
  );
}

/**
 * Form column only (the layout's artist panel and logo stay on screen): the
 * login layout, the most visited. The intro, passkey and provider buttons, the
 * divider, two fields, the submit button and the footer link.
 */
export default function AuthLoading() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-1 flex h-5 items-center">
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="order-1 grid gap-4">
          <Skeleton className={cn(authSquareLgButtonStyles, tone)} />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className={cn(authSquareButtonStyles, tone)} />
              <Skeleton className={cn(authSquareButtonStyles, tone)} />
            </div>

            <div className="flex h-4 items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              <Skeleton className="h-2.5 w-6" />
            </div>
          </div>
        </div>

        <div className="order-2 grid gap-4">
          <FieldSkeleton />
          <FieldSkeleton />

          <Skeleton className={cn(authPrimaryButtonStyles, tone)} />
        </div>
      </div>

      <div className="flex h-4 items-center justify-center">
        <Skeleton className="h-2.5 w-44" />
      </div>
    </div>
  );
}
