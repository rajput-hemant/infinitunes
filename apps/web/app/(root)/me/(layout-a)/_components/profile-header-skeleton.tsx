import { Skeleton } from "@infinitunes/ui/components/skeleton";

/** Mirrors the profile header: the 80px avatar, name and email, then two buttons. */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-5" aria-busy="true">
      <Skeleton className="size-20 rounded-full" />

      <div className="min-w-48 flex-1">
        <div className="flex h-8 items-center sm:h-9">
          <Skeleton className="h-5 w-40 sm:h-6" />
        </div>
        <div className="flex h-6 items-center">
          <Skeleton className="h-3.5 w-52 max-w-full" />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-(--ctl) w-32 rounded-(--r-ctl)" />
        <Skeleton className="h-(--ctl) w-24 rounded-(--r-ctl)" />
      </div>
    </div>
  );
}
