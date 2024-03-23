import Link from "next/link";

import type { Lang, Type } from "@/types";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { languages } from "@/config/languages";
import { cn } from "@/lib/utils";

// TODO: remove type prop
type LanguageBarProps = { type?: Type; language?: Lang };

export function LanguageBar({ language }: LanguageBarProps) {
  return (
    <ScrollArea className="border-y py-2">
      <div className="flex space-x-2 py-1 sm:space-x-6 md:space-x-10 lg:space-x-12">
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

        {languages.map((lang) => (
          <Link key={lang} title={lang} href={`?lang=${lang.toLowerCase()}`}>
            <Badge
              className={cn(
                "bg-primary-foreground p-2 text-primary hover:bg-muted hover:shadow lg:px-4",
                language === lang.toLowerCase() &&
                  "!bg-primary text-primary-foreground"
              )}
            >
              {lang}
            </Badge>
          </Link>
        ))}
      </div>

      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}

// TODO: remove default export
export default LanguageBar;
