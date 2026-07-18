import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

type SongListSkeletonProps = {
  length?: number;
  showAlbum?: boolean;
};

export function SongListSkeleton(props: SongListSkeletonProps) {
  const { length = 1, showAlbum = true } = props;
  return (
    <div className="pointer-events-none space-y-2 text-muted-foreground">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="flex h-14 w-full cursor-pointer items-center justify-between rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-sm"
        >
          <div className="hidden w-[6%] lg:flex lg:justify-center xl:w-[4%]">
            <Skeleton className="h-5 w-3" />
          </div>

          <div className="flex items-center justify-between gap-4 overflow-hidden lg:w-[86%]">
            {showAlbum && <Skeleton className="size-10 shrink-0" />}

            <div
              className={cn(
                "flex w-full flex-col lg:w-[calc(100%-0.5rem)] lg:flex-row",
                showAlbum && "xl:w-2/3"
              )}
            >
              <div className="w-full">
                <Skeleton className="h-4 w-52 md:w-80" />
              </div>
              <div className="w-full">
                <Skeleton className="h-4 w-64 md:w-72" />
              </div>
            </div>

            {showAlbum && (
              <div className="hidden w-1/3 xl:block">
                <Skeleton className="h-4 w-72" />
              </div>
            )}
          </div>

          <div className="flex w-[12%] items-center justify-end gap-3 lg:w-[16%] lg:shrink-0 lg:justify-between xl:w-[12%] 2xl:w-[10%]">
            <Skeleton className="hidden size-5 lg:block" />
            <Skeleton className="hidden size-5 lg:block" />
            <Skeleton className="hidden h-5 w-[38.5px] lg:block" />
            <Skeleton className="size-6 lg:size-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
