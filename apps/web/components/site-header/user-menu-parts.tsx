import {
  Heart,
  Library,
  type LucideIcon,
  Palette,
  Settings,
} from "lucide-react";
import type { Route } from "next";

import { UserAvatar } from "~/components/user-avatar";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

export type UserMenuUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type UserMenuLink = {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Pages behind sign in are left out of the guest menu. */
  needsUser: boolean;
};

export const userMenuLinks: UserMenuLink[] = [
  { href: "/me", label: "Library", icon: Library, needsUser: true },
  {
    href: "/me/liked-songs",
    label: "Liked Songs",
    icon: Heart,
    needsUser: true,
  },
  { href: "/settings", label: "Settings", icon: Settings, needsUser: false },
  {
    href: "/settings/appearance",
    label: "Appearance",
    icon: Palette,
    needsUser: false,
  },
];

export function linksFor(user: UserMenuUser | undefined) {
  return userMenuLinks.filter((link) => user || !link.needsUser);
}

export const userMenuTriggerClassName = cn(
  controlStyles.headerIcon,
  "flex items-center justify-center rounded-full",
);

export function UserMenuTriggerAvatar({ user }: { user?: UserMenuUser }) {
  return <UserAvatar size="toolbar" user={user} />;
}

export function UserMenuIdentity({ user }: { user?: UserMenuUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar size="menu" user={user} className="shrink-0" />

      <div className="flex min-w-0 flex-col text-left">
        <span
          title={user?.name ?? undefined}
          className="truncate font-semibold"
        >
          {user ? user.name || "~" : "Guest User"}
        </span>
        <span
          title={user?.email ?? undefined}
          className="truncate text-sm font-normal text-muted-foreground"
        >
          {user?.email}
        </span>
      </div>
    </div>
  );
}
