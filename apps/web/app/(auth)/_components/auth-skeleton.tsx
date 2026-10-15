import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { cn } from "~/lib/utils";

import {
  authInputStyles,
  authPrimaryButtonStyles,
  authSquareButtonStyles,
  authSquareLgButtonStyles,
} from "./field-styles";

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

type AuthFormSkeletonProps = {
  /** Input fields above the submit button. */
  fields: number;
  /** The passkey button above the provider buttons (login only). */
  passkey?: boolean;
  /** The provider buttons and the divider under them. */
  social?: boolean;
};

/**
 * Stands in for a form that reads the query string (`useSearchParams`) until
 * the request is known. The intro and footer links around it are static copy.
 */
export function AuthFormSkeleton({
  fields,
  passkey = false,
  social = true,
}: AuthFormSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {social && (
        <div className="order-1 grid gap-4">
          {passkey && (
            <Skeleton className={cn(authSquareLgButtonStyles, tone)} />
          )}

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
      )}

      <div className="order-2 grid gap-4">
        {Array.from({ length: fields }, (_, i) => (
          <FieldSkeleton key={i} />
        ))}

        <Skeleton className={cn(authPrimaryButtonStyles, tone)} />
      </div>
    </div>
  );
}
