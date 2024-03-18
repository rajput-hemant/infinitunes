import { Skeleton } from "@/components/ui/skeleton";

export default function HomePageLoading() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="mb-4 space-y-4">
      <div className="border-b pb-2">
        <Skeleton className="h-8 w-72 sm:h-9 md:h-10" />
      </div>

      <div className="grid grid-flow-col grid-rows-2 place-content-start pb-6 sm:gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-32 rounded-md sm:w-36 sm:border md:w-48 lg:w-56"
          >
            <div className="size-full p-2">
              <Skeleton className="size-28 sm:size-[126px] md:size-[174px] lg:size-[206px]" />

              <div className="mt-1 space-y-1 lg:space-y-1.5">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-3 w-full lg:h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}
