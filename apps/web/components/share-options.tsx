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
  title?: string;
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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center"
    >
      <Icon
        className={cn(
          "mr-2 inline-block aspect-square h-5",
          isDropDownItem && "h-4",
        )}
      />
      {label}
    </a>
  ) : (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center"
      aria-label={isCopied ? "Link Copied" : "Copy Link"}
    >
      <Clipboard
        className={cn(
          "mr-2 inline-block aspect-square h-5",
          isDropDownItem && "h-4",
        )}
      />
      <span className="grid" aria-live="polite">
        <span
          aria-hidden={isCopied}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-120 motion-reduce:transition-none",
            isCopied && "opacity-0",
          )}
        >
          Copy Link
        </span>
        <span
          aria-hidden={!isCopied}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-120 motion-reduce:transition-none",
            !isCopied && "opacity-0",
          )}
        >
          Link Copied
        </span>
      </span>
    </button>
  );
}

export function ShareOptions({
  isDropDownItem,
  title = siteConfig.name,
  ...props
}: ShareOptionsProps) {
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
          ? buildShareUrl(platform, { url, title })
          : undefined;

        return isDropDownItem ? (
          <DropdownMenuItem key={i} className="h-11 py-0">
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
