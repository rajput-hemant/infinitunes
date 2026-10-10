import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { languages } from "~/config/languages";

export function LanguageBarSkeleton() {
  return (
    <div className="mb-6 p-0.5">
      <ul className="flex gap-2">
        {["for_you", ...languages].map((lang) => (
          <li key={lang} className="shrink-0">
            <Skeleton className="h-(--ctl) w-20 rounded-(--r-ctl)" />
          </li>
        ))}
      </ul>
    </div>
  );
}
