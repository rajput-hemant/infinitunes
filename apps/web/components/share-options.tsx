"use client";

import { DropdownMenuItem } from "@infinitunes/ui/components/dropdown-menu";
import { Clipboard, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { siteConfig } from "~/config/site";
import { controlStyles } from "~/lib/control-styles";
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
  copy: () => void;
  isCopied: boolean;
};

const itemStyles = cn(
  controlStyles.textLg,
  "flex items-center gap-3 rounded-sm px-3 transition-colors duration-fast hover:bg-fill-2 active:bg-fill-3",
);

function MenuItem({ label, href, icon: Icon, copy, isCopied }: MenuItemProps) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={itemStyles}
    >
      <Icon className="size-4" />
      {label}
    </a>
  ) : (
    <button
      type="button"
      onClick={copy}
      className={itemStyles}
      aria-label={isCopied ? "Link Copied" : "Copy Link"}
    >
      <Clipboard className="size-4" />
      <span className="grid">
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
    toast.success("Link copied");
  }

  return (
    <div {...props}>
      {shareOptions.map(({ label, platform, icon }, i) => {
        const href = platform
          ? buildShareUrl(platform, { url, title })
          : undefined;

        return isDropDownItem ? (
          <DropdownMenuItem key={i} className="p-0">
            <MenuItem
              label={label}
              href={href}
              icon={icon}
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
            copy={copy}
            isCopied={isCopied}
          />
        );
      })}
    </div>
  );
}
