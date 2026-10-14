import Link from "next/link";

import { chipClass } from "~/components/language-chip";
import { languages } from "~/config/languages";
import { asRoute } from "~/lib/utils";

const CHIP_COUNT = 10;

/** "For you" is the current view; each language opens that language's albums. */
export function HomeLanguageChips() {
  return (
    <nav
      aria-label="Languages"
      className="-m-0.5 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-2">
        <li>
          <span aria-current="true" className={chipClass(true)}>
            For&nbsp;you
          </span>
        </li>

        {languages.slice(0, CHIP_COUNT).map((lang) => (
          <li key={lang}>
            <Link
              href={asRoute(`/album?lang=${lang.toLowerCase()}`)}
              className={chipClass(false)}
            >
              {lang}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
