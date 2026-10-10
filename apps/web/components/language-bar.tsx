import type { Lang } from "@infinitunes/types";
import Link from "next/link";

import { languages } from "~/config/languages";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

type LanguageBarProps = { language?: Lang };

const chipBase = cn(
  controlStyles.text,
  "inline-flex shrink-0 items-center gap-2 px-3 text-[0.8125rem] leading-5 font-medium transition-[background-color,transform] duration-fast active:scale-96",
);

function chipClass(selected: boolean) {
  return selected
    ? cn(chipBase, "bg-foreground text-background")
    : cn(chipBase, "bg-fill hover:bg-fill-2");
}

export function LanguageBar({ language }: LanguageBarProps) {
  return (
    <div className="mb-6 overflow-x-auto p-0.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2">
        <li>
          <Link
            title="For You"
            href={asRoute("?")}
            aria-pressed={!language}
            className={chipClass(!language)}
          >
            For&nbsp;you
          </Link>
        </li>

        {languages.map((lang) => {
          const selected = language === lang.toLowerCase();

          return (
            <li key={lang}>
              <Link
                title={lang}
                href={asRoute(`?lang=${lang.toLowerCase()}`)}
                aria-pressed={selected}
                className={chipClass(selected)}
              >
                {lang}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
