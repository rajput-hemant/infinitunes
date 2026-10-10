import Link from "next/link";

import { languages } from "~/config/languages";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

const CHIP_COUNT = 10;

const chip = cn(
  controlStyles.text,
  "inline-flex shrink-0 items-center px-3 text-[0.8125rem] leading-5 font-medium transition-[background-color,transform] duration-fast active:scale-96",
);

/** "For you" is the current view; each language opens that language's albums. */
export function HomeLanguageChips() {
  return (
    <nav
      aria-label="Languages"
      className="-m-0.5 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-2">
        <li>
          <span
            aria-current="true"
            className={cn(chip, "bg-foreground text-background")}
          >
            For&nbsp;you
          </span>
        </li>

        {languages.slice(0, CHIP_COUNT).map((lang) => (
          <li key={lang}>
            <Link
              href={asRoute(`/album?lang=${lang.toLowerCase()}`)}
              className={cn(chip, "bg-fill hover:bg-fill-2")}
            >
              {lang}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
