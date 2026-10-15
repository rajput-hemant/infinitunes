"use client";

import type { Lang } from "@infinitunes/types";
import Link from "next/link";

import { languages } from "~/config/languages";
import { pendingOnClick, usePendingParams } from "~/lib/pending-params";
import { asRoute } from "~/lib/utils";

import { chipClass } from "./language-chip";
import { SearchParamsBoundary } from "./search-params-boundary";
import { isLang } from "./site-header/lang-guard";

function LanguageChips({ language: current }: { language?: Lang }) {
  // The clicked chip is selected now; the URL catches up when the route commits.
  const requested = usePendingParams().get("lang");
  const language =
    requested === undefined
      ? current
      : isLang(requested)
        ? requested
        : undefined;

  return (
    <div className="mb-6 overflow-x-auto p-0.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2">
        <li>
          <Link
            title="All"
            href={asRoute("?")}
            aria-current={!language ? "page" : undefined}
            className={chipClass(!language)}
            onClick={pendingOnClick("lang", "")}
          >
            All
          </Link>
        </li>

        {languages.map((lang) => {
          const selected = language === lang.toLowerCase();

          return (
            <li key={lang}>
              <Link
                title={lang}
                href={asRoute(`?lang=${lang.toLowerCase()}`)}
                aria-current={selected ? "page" : undefined}
                className={chipClass(selected)}
                onClick={pendingOnClick("lang", lang.toLowerCase())}
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

/**
 * The language chips for a list page. The chips are the same on every request,
 * so they prerender with the page; which one is selected comes from `?lang=` and
 * is filled in as soon as the query string is known.
 */
export function LanguageBar() {
  return (
    <SearchParamsBoundary
      render={(params) => {
        const lang = params?.get("lang") ?? "";
        return <LanguageChips language={isLang(lang) ? lang : undefined} />;
      }}
    />
  );
}
