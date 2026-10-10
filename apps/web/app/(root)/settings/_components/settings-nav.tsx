"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHash } from "~/hooks/use-hash";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

import { settingsNavGroups } from "./settings-nav-groups";

export function SettingsNav() {
  const pathname = usePathname();
  const hash = useHash();

  return (
    <>
      <nav
        aria-label="Settings sections"
        className="top-20 hidden gap-4 lg:sticky lg:grid"
      >
        {settingsNavGroups.map(({ title, href, items }) => (
          <div key={title} className="grid gap-0.5">
            <p className="px-3 pb-1 text-sm/5 font-bold">{title}</p>

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
                    "flex items-center gap-2 rounded-sm text-sm/5 font-medium text-muted-foreground ease-spring transition-colors duration-fast hover:bg-fill hover:text-foreground active:bg-fill-2",
                    active && "bg-fill-2 text-foreground",
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

      <nav
        aria-label="Settings pages"
        className="grid grid-cols-3 gap-0.5 rounded-ctl bg-fill p-0.5 lg:hidden"
      >
        {settingsNavGroups.map(({ title, href }) => {
          const active = pathname === href;

          return (
            <Link
              key={title}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                controlStyles.text,
                "inline-flex items-center justify-center text-sm font-medium text-muted-foreground ease-spring transition-colors duration-fast",
                active && "bg-card text-foreground shadow-xs",
              )}
            >
              {title}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
