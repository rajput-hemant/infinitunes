import { Skeleton } from "@infinitunes/ui/components/skeleton";

/** Form column only: the layout's artist panel stays on screen while this loads. */
export default function AuthLoading() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64 max-w-full" />
      </div>

      <div className="grid gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <Skeleton className="h-10 w-full" />
      <Skeleton className="mx-auto h-4 w-44" />
    </div>
  );
}
