"use client";

import { DropdownMenuItem } from "@infinitunes/ui/components/dropdown-menu";
import { Clipboard, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

import { siteConfig } from "~/config/site";
import { buildShareUrl } from "~/lib/share";
import type { SharePlatform } from "~/lib/share";
import { cn } from "~/lib/utils";

import { Icons } from "./icons";

type ShareOptionsProps = React.ComponentProps<"div"> & {
  isDropDownItem?: boolean;
};

type ShareOption = {
  label: string;
  platform?: SharePlatform;
  icon: React.FC<{ className: string }>;
};

const shareOptions: ShareOption[] = [
  {
    label: "Copy Link",
    icon: ({ className }) => <Clipboard className={className} />,
  },
  {
    label: "WhatsApp",
    platform: "whatsapp",
    icon: ({ className }) => <Icons.WhatsApp className={className} />,
  },
  {
    label: "Telegram",
    platform: "telegram",
    icon: ({ className }) => <Icons.Telegram className={className} />,
  },
  {
    label: "Twitter",
    platform: "twitter",
    icon: ({ className }) => <Icons.X className={className} />,
  },
  {
    label: "Facebook",
    platform: "facebook",
    icon: ({ className }) => <Icons.Facebook className={className} />,
  },
  {
    label: "Email",
    platform: "email",
    icon: ({ className }) => <Mail className={className} />,
  },
];

type MenuItemProps = Omit<ShareOption, "platform"> & {
  href?: string;
  isDropDownItem?: boolean;
  copy: () => void;
  isCopied: boolean;
};

function MenuItem({
  label,
  href,
  icon: Icon,
  isDropDownItem,
  copy,
  isCopied,
}: MenuItemProps) {
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Icon
        className={cn(
          "mr-2 inline-block aspect-square h-5",
          isDropDownItem && "h-4",
        )}
      />
      {label}
    </a>
  ) : (
    <button onClick={copy} className="inline-flex">
      <Clipboard
        className={cn(
          "mr-2 inline-block aspect-square h-5",
          isDropDownItem && "h-4",
        )}
      />
      {isCopied ? "Link Copied" : "Copy Link"}
    </button>
  );
}

export function ShareOptions({ isDropDownItem, ...props }: ShareOptionsProps) {
  const pathname = usePathname();

  const [isCopied, setIsCopied] = React.useState(false);

  const url = `${siteConfig.url}${pathname}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
  }

  return (
    <div {...props}>
      {shareOptions.map(({ label, platform, icon }, i) => {
        const href = platform
          ? buildShareUrl(platform, { url, title: siteConfig.name })
          : undefined;

        return isDropDownItem ? (
          <DropdownMenuItem key={i}>
            <MenuItem
              label={label}
              href={href}
              icon={icon}
              isDropDownItem
              copy={copy}
              isCopied={isCopied}
            />
          </DropdownMenuItem>
        ) : (
          <MenuItem
            key={i}
            label={label}
            href={href}
            icon={icon}
            isDropDownItem={isDropDownItem}
            copy={copy}
            isCopied={isCopied}
          />
        );
      })}
    </div>
  );
}
