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
  /** Site path of the thing being shared; defaults to the current page. */
  path?: string;
};

type ShareIconProps = { className: string };

type ShareOption = {
  label: string;
  platform?: SharePlatform;
  icon: (props: ShareIconProps) => React.ReactNode;
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
  /** Render as the dropdown menu item itself, so each option is one control. */
  isDropDownItem?: boolean;
};

const itemStyles = cn(
  controlStyles.textLg,
  "flex w-full items-center justify-start gap-3 rounded-sm px-3 text-left transition-colors duration-fast hover:bg-fill-2 active:bg-fill-3",
);

// A dropdown item already carries the menu's own focus and hover styles.
const dropdownItemStyles = "w-full justify-start gap-3 text-left";

/**
 * Only the current state is in the DOM, so the control's accessible name and
 * text are just "Copy Link" or "Link Copied". The pseudo-element holds the
 * wider label's width, so the menu does not resize when the text swaps.
 */
function CopyLabel({ isCopied }: { isCopied: boolean }) {
  return (
    <span className="flex flex-col after:invisible after:block after:h-0 after:overflow-hidden after:content-['Link_Copied']">
      {isCopied ? "Link Copied" : "Copy Link"}
    </span>
  );
}

function MenuItem({
  label,
  href,
  icon: Icon,
  copy,
  isCopied,
  isDropDownItem,
}: MenuItemProps) {
  if (href) {
    const content = (
      <>
        <Icon className="size-4" />
        {label}
      </>
    );
    return isDropDownItem ? (
      <DropdownMenuItem
        className={dropdownItemStyles}
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
          />
        }
      >
        {content}
      </DropdownMenuItem>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={itemStyles}
      >
        {content}
      </a>
    );
  }

  return isDropDownItem ? (
    <DropdownMenuItem className={dropdownItemStyles} onClick={copy}>
      <Clipboard className="size-4" />
      <CopyLabel isCopied={isCopied} />
    </DropdownMenuItem>
  ) : (
    <button type="button" onClick={copy} className={itemStyles}>
      <Clipboard className="size-4" />
      <CopyLabel isCopied={isCopied} />
    </button>
  );
}

export function ShareOptions({
  isDropDownItem,
  title = siteConfig.name,
  path,
  ...props
}: ShareOptionsProps) {
  const pathname = usePathname();

  const [isCopied, setIsCopied] = React.useState(false);

  // An unresolvable item link is "#": share the page rather than a dead anchor.
  const url = `${siteConfig.url}${path?.startsWith("/") ? path : pathname}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Link copied");
  }

  return (
    <div {...props}>
      {shareOptions.map(({ label, platform, icon }) => {
        const href = platform
          ? buildShareUrl(platform, { url, title })
          : undefined;

        return (
          <MenuItem
            key={label}
            label={label}
            href={href}
            icon={icon}
            copy={copy}
            isCopied={isCopied}
            isDropDownItem={isDropDownItem}
          />
        );
      })}
    </div>
  );
}
