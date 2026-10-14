import { Skeleton } from "@infinitunes/ui/components/skeleton";

const ROW_COUNT = 6;

/** Mirrors the search root: title, the search field, then the top-search rows. */
export default function SearchLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <header className="pt-2">
        <Skeleton className="h-8 w-40 md:h-10" />
      </header>

      <Skeleton className="h-11 w-full" />

      <section className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
