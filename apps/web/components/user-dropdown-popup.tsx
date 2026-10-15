"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Keyboard, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeToggleGroup } from "~/components/site-footer/theme-toggle-group";
import { KeyboardShortcutsDialog } from "~/components/site-header/keyboard-shortcuts-dialog";
import { useIsPhone } from "~/components/site-header/use-is-phone";
import {
  linksFor,
  UserMenuIdentity,
  type UserMenuUser,
  UserMenuTriggerAvatar,
  userMenuTriggerClassName,
} from "~/components/site-header/user-menu-parts";
import { UserMenuSheet } from "~/components/site-header/user-menu-sheet";
import { useSignOut } from "~/hooks/use-sign-out";

type UserDropdownPopupProps = {
  user?: UserMenuUser;
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
};

/**
 * The real user menu, loaded on intent by `UserDropdown`: anchored dropdown
 * from 768px, bottom sheet below it (`UserMenuSheet`).
 */
export function UserDropdownPopup({
  user,
  defaultOpen,
}: UserDropdownPopupProps) {
  const isPhone = useIsPhone();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      {isPhone ? (
        <UserMenuSheet
          user={user}
          defaultOpen={defaultOpen}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
      ) : (
        <DesktopUserMenu
          user={user}
          defaultOpen={defaultOpen}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
      )}

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}

type UserMenuProps = UserDropdownPopupProps & {
  onShowShortcuts: () => void;
};

function DesktopUserMenu({
  user,
  defaultOpen,
  onShowShortcuts,
}: UserMenuProps) {
  const signOut = useSignOut();

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        data-deferred="user-menu"
        className={userMenuTriggerClassName}
      >
        <UserMenuTriggerAvatar user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        className="min-w-56 max-w-xs pointer-coarse:min-w-72 *:cursor-pointer [&_[data-slot=dropdown-menu-item]]:min-h-(--ctl) [&_[data-slot=dropdown-menu-item]]:pointer-coarse:min-h-(--ctl-lg)"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <UserMenuIdentity user={user} />
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {linksFor(user).map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon aria-hidden size={16} className="mr-2" />
            {label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <div className="px-1.5 py-1">
          <ThemeToggleGroup stretch />
        </div>

        <DropdownMenuItem onClick={onShowShortcuts}>
          <Keyboard aria-hidden size={16} className="mr-2" />
          Keyboard shortcuts
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {user ? (
          <DropdownMenuItem onClick={signOut}>
            <LogOut aria-hidden size={16} className="mr-2" />
            Log out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem render={<Link href="/login" />}>
            <LogIn aria-hidden size={16} className="mr-2" />
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
