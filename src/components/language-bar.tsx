import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { languages } from "@/config/languages";
import { cn } from "@/lib/utils";
import { Lang, Type } from "@/types";

type Props = { type: Type; language?: Lang };

const LanguageBar = ({ type, language }: Props) => {
  return (
    <ScrollArea>
      <div className="flex space-x-2 sm:space-x-6 md:space-x-10 lg:space-x-12">
        <Link title="For You" href={`/${type}`}>
          <Badge
            className={cn(
              "bg-primary p-2 lg:px-4",
              language && "bg-primary-foreground text-primary hover:bg-muted"
            )}
          >
            For&nbsp;you
          </Badge>
        </Link>

        {languages.map((lang) => (
          <Link
            key={lang}
            title={lang}
            href={`/${type}?lang=${lang.toLowerCase()}`}
          >
            <Badge
              className={cn(
                "bg-primary-foreground text-primary hover:bg-muted p-2 lg:px-4",
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
};

export default LanguageBar;
