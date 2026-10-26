"use client";

import { Search } from "lucide-react";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { useThemeConfig } from "~/hooks/use-theme-config";
import { cn } from "~/lib/utils";

import { matchesQuery } from "./settings-match";

type SettingsSearchValue = {
  query: string;
  setQuery: (query: string) => void;
};

const SettingsSearchContext = React.createContext<SettingsSearchValue>({
  query: "",
  setQuery: () => {},
});

/** The text typed into the settings search (empty when not searching). */
export function useSettingsQuery() {
  return React.use(SettingsSearchContext).query;
}

/** True when a row, card or control with this text should show for the current search. */
export function useSettingsMatch(text: string) {
  return matchesQuery(text, useSettingsQuery());
}

/**
 * Owns the search text for the whole page. Rows read it through
 * `useSettingsMatch` and hide themselves; cards and sections hide with CSS
 * when none of their rows are left (`group-data-searching`). Streamed-in
 * sections are covered too, because filtering lives in the rows themselves.
 */
export function SettingsSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const [isEmpty, setIsEmpty] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searching = query.trim() !== "";

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      setIsEmpty(
        searching &&
          root.querySelector("[data-settings-row]:not([hidden])") === null,
      );
    };

    measure();
    // Rows that stream in (or are mounted late) while a search is active.
    const observer = new MutationObserver(measure);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributeFilter: ["hidden"],
    });
    return () => observer.disconnect();
  }, [searching]);

  return (
    <SettingsSearchContext value={{ query, setQuery }}>
      <div
        ref={rootRef}
        data-searching={searching ? "" : undefined}
        data-empty={isEmpty ? "" : undefined}
        className="group/settings"
      >
        {children}
      </div>
    </SettingsSearchContext>
  );
}

/** Shown when a search leaves no rows. */
export function SettingsEmpty() {
  const query = useSettingsQuery();

  return (
    <output className="mx-auto hidden max-w-sm py-12 text-center group-data-empty/settings:block">
      <p className="font-heading text-lg">No settings match</p>
      <p className="text-muted-foreground">
        Nothing matches &ldquo;{query.trim()}&rdquo;. Try &ldquo;glass&rdquo;,
        &ldquo;font&rdquo; or &ldquo;quality&rdquo;.
      </p>
    </output>
  );
}

const IGNORED_TARGETS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** The search pill. `/` focuses it from anywhere on the page that is not a text field. */
export function SettingsSearchField({ className }: { className?: string }) {
  const { query, setQuery } = React.use(SettingsSearchContext);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (IGNORED_TARGETS.has(target.tagName) || target.isContentEditable)
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <GlassSurface
      size="s"
      render={<search />}
      className={cn(
        "flex h-(--ctl-lg) max-w-full sm:w-60 items-center gap-2 rounded-(--r-ctl) px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            event.currentTarget.blur();
          }
        }}
        placeholder="Search settings"
        aria-label="Search settings"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd
        aria-hidden
        className="rounded-xs border border-line px-1.5 text-[0.6875rem]/4 font-medium text-muted-foreground"
      >
        /
      </kbd>
    </GlassSurface>
  );
}

/** What the last theme change did: saving, or saved. Appearance saves as you change it. */
export function SettingsSaveStatus({ className }: { className?: string }) {
  const { isSaving, changed } = useThemeConfig();

  // Nothing is shown until the appearance has changed: a first paint is not a save.
  if (!isSaving && !changed) return null;

  return (
    <GlassSurface
      size="s"
      render={<output />}
      className={cn(
        "inline-flex h-(--ctl-lg) shrink-0 items-center gap-2 rounded-(--r-ctl) px-3 text-xs/4 font-medium text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-emerald-500 transition-colors duration-fast",
          isSaving && "bg-amber-500",
        )}
      />
      {isSaving ? "Saving..." : "Appearance saved"}
    </GlassSurface>
  );
}
