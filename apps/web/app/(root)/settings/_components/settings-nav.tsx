"use client";

import {
  Download,
  Fingerprint,
  Headphones,
  ImageDown,
  Keyboard,
  Languages,
  Layers,
  Palette,
  Radius,
  Rows3,
  SunMoon,
  Trash2,
  Type,
  UserCog2,
  KeyRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useHash } from "~/hooks/use-hash";
import { controlStyles } from "~/lib/control-styles";
import { asRoute, cn } from "~/lib/utils";

type SettingsNavGroup = {
  title: string;
  href: Route;
  items: readonly { hash: string; title: string; icon: LucideIcon }[];
};

const groups: readonly SettingsNavGroup[] = [
  {
    title: "Account",
    href: "/settings",
    items: [
      { hash: "profile", title: "Edit Profile", icon: UserCog2 },
      { hash: "password", title: "Change Password", icon: KeyRound },
      { hash: "passkeys", title: "Passkeys", icon: Fingerprint },
      { hash: "delete", title: "Delete Account", icon: Trash2 },
    ],
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    items: [
      { hash: "mode", title: "Mode", icon: SunMoon },
      { hash: "accent", title: "Accent color", icon: Palette },
      { hash: "radius", title: "Radius", icon: Radius },
      { hash: "type", title: "Typography", icon: Type },
      { hash: "density", title: "Density", icon: Rows3 },
      { hash: "material", title: "Glass and motion", icon: Layers },
    ],
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    items: [
      { hash: "language", title: "Language", icon: Languages },
      { hash: "stream-quality", title: "Stream Quality", icon: Headphones },
      { hash: "download-quality", title: "Download Quality", icon: Download },
      { hash: "image-quality", title: "Image Quality", icon: ImageDown },
      { hash: "keyboard-shortcuts", title: "Keyboard", icon: Keyboard },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  const hash = useHash();

  return (
    <>
      <nav
        aria-label="Settings sections"
        className="top-20 hidden gap-4 lg:sticky lg:grid"
      >
        {groups.map(({ title, href, items }) => (
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
        {groups.map(({ title, href }) => {
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
