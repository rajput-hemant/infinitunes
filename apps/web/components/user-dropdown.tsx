"use client";

import { authClient } from "@infinitunes/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@infinitunes/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@infinitunes/ui/dropdown-menu";
import { Cog, LogOut, Monitor, Moon, Sun, SunMoon, User2 } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

type UserDropdownProps = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  };
};

export function UserDropdown({ user }: UserDropdownProps) {
  const { setTheme } = useTheme();

  async function signOutHandler() {
    toast.promise(authClient.signOut(), {
      loading: "Signing out...",
      success: "You have been signed out.",
      error: "Something went wrong.",
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="border shadow-xs">
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
        className="max-w-[300px] *:cursor-pointer"
      >
        <DropdownMenuLabel className="flex flex-col">
          <span title={user?.name ?? undefined} className="truncate">
            {user ? (user.name ? user.name : "~") : "Guest User"}
          </span>
          <span
            title={user?.email ?? undefined}
            className="truncate text-sm font-normal text-muted-foreground"
          >
            {user?.email}
          </span>
        </DropdownMenuLabel>

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
            <DropdownMenuItem onClick={signOutHandler}>
              <LogOut size={16} className="mr-2" />
              Log Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
