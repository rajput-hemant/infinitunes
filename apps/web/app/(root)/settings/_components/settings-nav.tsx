"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHash } from "~/hooks/use-hash";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

import { settingsNavGroups } from "./settings-nav-groups";

/**
 * One list of section links: grouped and sticky as a side nav from `lg`, a
 * single scrolling row of chips that bleeds to the page gutter below it.
 */
export function SettingsNav() {
  const pathname = usePathname();
  const hash = useHash();

  return (
    <nav
      aria-label="Settings sections"
      className="-mx-page flex gap-2 overflow-x-auto px-page [scrollbar-width:none] lg:sticky lg:top-20 lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {settingsNavGroups.map(({ title, href, items }) => (
        <div key={title} className="contents lg:grid lg:gap-0.5">
          <p className="hidden px-3 pb-1 text-sm/5 font-bold lg:block">
            {title}
          </p>

          {items.map((item, index) => {
            const active =
              pathname === href && (hash ? hash === item.hash : index === 0);

            return (
              <Link
                key={item.hash}
                href={asRoute(`${href}#${item.hash}`)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  controlStyles.text,
                  "flex flex-none items-center gap-2 rounded-(--r-ctl) bg-fill px-3 text-[0.8125rem]/5 font-medium whitespace-nowrap text-muted-foreground ease-spring transition-colors duration-fast hover:bg-fill-2 hover:text-foreground active:bg-fill-3 lg:rounded-sm lg:bg-transparent lg:hover:bg-fill lg:active:bg-fill-2",
                  active &&
                    "bg-fill-2 text-foreground lg:bg-fill-2 lg:hover:bg-fill-2",
                )}
              >
                <item.icon aria-hidden className="size-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
