"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@infinitunes/ui/components/drawer";
import { Keyboard, LogIn, LogOut } from "lucide-react";
import Link from "next/link";

import { ThemeToggleGroup } from "~/components/site-footer/theme-toggle-group";
import { useSignOut } from "~/hooks/use-sign-out";
import { cn, destructiveText } from "~/lib/utils";

import {
  linksFor,
  UserMenuIdentity,
  type UserMenuUser,
  UserMenuTriggerAvatar,
  userMenuTriggerClassName,
} from "./user-menu-parts";

const rowClassName =
  "flex h-11 w-full items-center gap-3 rounded-sm px-3 text-base font-medium outline-none hover:bg-fill-2 focus-visible:bg-fill-2 active:bg-fill-3 [&_svg]:size-4 [&_svg]:shrink-0";

type UserMenuSheetProps = {
  user?: UserMenuUser;
  onShowShortcuts: () => void;
};

export function UserMenuSheet({ user, onShowShortcuts }: UserMenuSheetProps) {
  const signOut = useSignOut();

  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger
        aria-label="Open user menu"
        className={userMenuTriggerClassName}
      >
        <UserMenuTriggerAvatar user={user} />
      </DrawerTrigger>

      <DrawerContent className="rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <DrawerTitle className="sr-only">User menu</DrawerTitle>

        <div className="flex flex-col gap-0.5 p-1.5">
          <div className="border-b px-3 pt-2 pb-3">
            <UserMenuIdentity user={user} />
          </div>

          {linksFor(user).map(({ href, label, icon: Icon }) => (
            <DrawerClose
              key={href}
              nativeButton={false}
              render={<Link href={href} className={rowClassName} />}
            >
              <Icon aria-hidden className="text-muted-foreground" />
              {label}
            </DrawerClose>
          ))}

          <div className="px-3 py-2">
            <ThemeToggleGroup stretch />
          </div>

          <DrawerClose onClick={onShowShortcuts} className={rowClassName}>
            <Keyboard aria-hidden className="text-muted-foreground" />
            Keyboard shortcuts
          </DrawerClose>

          {user ? (
            <DrawerClose
              onClick={signOut}
              className={cn(rowClassName, destructiveText)}
            >
              <LogOut aria-hidden />
              Log out
            </DrawerClose>
          ) : (
            <DrawerClose
              nativeButton={false}
              render={<Link href="/login" className={rowClassName} />}
            >
              <LogIn aria-hidden className="text-muted-foreground" />
              Sign in
            </DrawerClose>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
