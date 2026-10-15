import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** A card's eyebrow title, as `SettingsCard` lays it out. */
function SkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-line bg-card/70",
        className,
      )}
    >
      <div className="flex h-8 items-end px-4 pb-1">
        <Skeleton className="h-3 w-24" />
      </div>
      {children}
    </div>
  );
}

/** A label-and-help pair with a control opposite, the shape of `SettingsRow`. */
function SkeletonRow({ control }: { control: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 last:border-b-0">
      <div className="space-y-1">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
      </div>
      {control}
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="grid gap-2">
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-20" />
      </div>
      <Skeleton className={cn(controlStyles.textLg, "w-full rounded-sm")} />
    </div>
  );
}

function SkeletonFormBlock({ submitWidth }: { submitWidth: string }) {
  return (
    <div className="grid gap-4 border-b border-line px-4 py-4 last:border-b-0">
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonField />
        <SkeletonField />
      </div>
      <div className="flex justify-end">
        <Skeleton className={cn(controlStyles.textLg, submitWidth)} />
      </div>
    </div>
  );
}

/** The profile and password card while the signed-in user resolves or the form code loads. */
export function ProfileCardSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonFormBlock submitWidth="w-28" />
      <SkeletonFormBlock submitWidth="w-32" />
    </SkeletonCard>
  );
}

/** One row opposite a button: passkeys and the danger zone. */
export function ActionCardSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonRow
        control={<Skeleton className={cn(controlStyles.text, "w-32")} />}
      />
    </SkeletonCard>
  );
}

/** The three Playback cards: languages (chips), quality (three rows), keyboard (a switch). */
export function PlaybackSkeleton() {
  return (
    <>
      <SkeletonCard>
        <div className="grid gap-3 px-4 py-3.5">
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn(controlStyles.text, "w-20")} />
            ))}
          </div>
          <Skeleton className={cn(controlStyles.textLg, "w-36")} />
        </div>
      </SkeletonCard>

      <SkeletonCard>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRow
            key={i}
            control={
              <Skeleton
                className={cn(controlStyles.text, "w-48 max-sm:w-full")}
              />
            }
          />
        ))}
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonRow
          control={<Skeleton className="h-[18.4px] w-8 rounded-full" />}
        />
      </SkeletonCard>
    </>
  );
}
