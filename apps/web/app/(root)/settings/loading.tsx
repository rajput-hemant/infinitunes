import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

const FIELD_COUNT = 2;

/**
 * The body under the settings header and nav: a `SettingsSection` (title,
 * description) holding labelled fields, as the profile form lays them out.
 */
export default function SettingsLoading() {
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
      aria-busy="true"
    >
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
      </div>

      <div className="grid max-w-md gap-5">
        {Array.from({ length: FIELD_COUNT }).map((_, i) => (
          <div key={i} className="grid gap-2">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton
              className={cn(controlStyles.textLg, "w-full rounded-sm")}
            />
          </div>
        ))}

        <Skeleton className={cn(controlStyles.text, "w-28 rounded-sm")} />
      </div>
    </div>
  );
}
