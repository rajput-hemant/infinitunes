"use client";

import { DropdownMenuItem } from "@infinitunes/ui/components/dropdown-menu";
import { Clipboard, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";

type ShareOptionsProps = React.ComponentProps<"div"> & {
  isDropDownItem?: boolean;
};

type ShareOption = {
  label: string;
  href?: string;
  icon: React.FC<{ className: string }>;
};

const shareOptions: ShareOption[] = [
  {
    label: "Copy Link",
    icon: ({ className }) => <Clipboard className={className} />,
  },
  {
    label: "WhatsApp",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Icons.WhatsApp className={className} />,
  },
  {
    label: "Telegram",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Icons.Telegram className={className} />,
  },
  {
    label: "Twitter",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Icons.X className={className} />,
  },
  {
    label: "Facebook",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Icons.Facebook className={className} />,
  },
  {
    label: "Email",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Mail className={className} />,
  },
];

type MenuItemProps = ShareOption & {
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

  function copy() {
    navigator.clipboard.writeText(`${siteConfig.url}${pathname}`);
    setIsCopied(true);
  }

  return (
    <div {...props}>
      {shareOptions.map(({ label, href, icon }, i) => {
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
