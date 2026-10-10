import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@infinitunes/ui/components/avatar";
import { User2 } from "lucide-react";

import { cn } from "~/lib/utils";

const sizeClassNames = {
  toolbar: "size-8 text-[0.8125rem]/[0.8125rem]",
  menu: "size-10 text-base",
  profile: "size-20 text-[1.75rem]/7",
} as const;

type UserAvatarProps = {
  size: keyof typeof sizeClassNames;
  /** Omit for a signed-out visitor, which shows a generic glyph. */
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  className?: string;
};

export function userInitial(user: UserAvatarProps["user"]) {
  const source = user?.name?.trim() || user?.email?.trim();

  return source ? source.charAt(0).toUpperCase() : null;
}

export function UserAvatar({ size, user, className }: UserAvatarProps) {
  const initial = userInitial(user);

  return (
    <Avatar className={cn(sizeClassNames[size], className)}>
      <AvatarImage src={user?.image ?? undefined} alt="" />
      <AvatarFallback className="bg-primary font-bold text-primary-foreground">
        {initial ?? <User2 aria-hidden className="size-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
