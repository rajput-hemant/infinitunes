"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@infinitunes/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Cog, LogOut, Monitor, Moon, Sun, SunMoon, User2 } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

import { useSignOut } from "~/hooks/use-sign-out";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type UserDropdownProps = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function UserDropdown({ user }: UserDropdownProps) {
  const { setTheme } = useTheme();
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className={cn(
          controlStyles.headerIcon,
          "flex items-center justify-center rounded-full",
        )}
      >
        <Avatar className="border">
          <AvatarImage
            src={user?.image ?? undefined}
            alt={user?.name ?? "Guest User"}
          />
          <AvatarFallback
            render={
              <Image
                src="/images/placeholder/user.jpg"
                alt={user?.name ?? "Guest User"}
                fill
                className="dark:invert"
              />
            }
          />
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        className="min-w-56 max-w-xs *:cursor-pointer [&_[data-slot=dropdown-menu-item]]:min-h-(--ctl) [&_[data-slot=dropdown-menu-item]]:pointer-coarse:min-h-(--ctl-lg)"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span title={user?.name ?? undefined} className="truncate">
              {user ? user.name || "~" : "Guest User"}
            </span>
            <span
              title={user?.email ?? undefined}
              className="truncate text-sm font-normal text-muted-foreground"
            >
              {user?.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={user === undefined}
          render={<Link href="/me" />}
        >
          <User2 size={16} className="mr-2" />
          My Profile
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/settings" />}>
          <Cog size={16} className="mr-2" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon size={16} className="mr-2" />
            Theme
          </DropdownMenuSubTrigger>

          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="cursor-pointer"
              >
                <Sun size={16} className="mr-2" />
                Light
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="cursor-pointer"
              >
                <Moon size={16} className="mr-2" />
                Dark
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="cursor-pointer"
              >
                <Monitor size={16} className="mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut size={16} className="mr-2" />
              Log Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
