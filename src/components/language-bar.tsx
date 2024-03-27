import Link from "next/link";

import type { Lang } from "@/types";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { languages } from "@/config/languages";
import { cn } from "@/lib/utils";

type LanguageBarProps = { language?: Lang };

export function LanguageBar({ language }: LanguageBarProps) {
  return (
    <ScrollArea className="border-b py-2">
      <ul className="flex space-x-2 py-1 sm:space-x-6 md:space-x-10 lg:space-x-12">
        <li>
          <Link title="For You" href="?">
            <Badge
              className={cn(
                "bg-primary p-2 hover:shadow lg:px-4",
                language && "bg-primary-foreground text-primary hover:bg-muted"
              )}
            >
              For&nbsp;you
            </Badge>
          </Link>
        </li>

        {languages.map((lang) => (
          <li key={lang}>
            <Link title={lang} href={`?lang=${lang.toLowerCase()}`}>
              <Badge
                className={cn(
                  "bg-primary-foreground p-2 text-primary hover:bg-muted hover:shadow-sm lg:px-4",
                  language === lang.toLowerCase() &&
                    "!bg-primary text-primary-foreground"
                )}
              >
                {lang}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>

      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
