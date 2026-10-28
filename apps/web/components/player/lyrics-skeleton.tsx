import { Skeleton } from "@infinitunes/ui/components/skeleton";

export function LyricsSkeleton() {
  return (
    <output aria-label="Loading lyrics" className="block space-y-6 px-4 py-8">
      <span className="sr-only">Loading lyrics</span>
      <div aria-hidden="true" className="space-y-6">
        {["w-4/5", "w-3/5", "w-5/6", "w-2/3"].map((width) => (
          <Skeleton key={width} className={`h-8 ${width}`} />
        ))}
      </div>
    </output>
  );
}
