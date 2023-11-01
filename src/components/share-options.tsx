import React from "react";
import { Clipboard, Facebook, Mail, Twitter } from "lucide-react";

import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

type Props = {
  isDropDownItem?: boolean;
  className?: string;
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
    icon: ({ className }) => <Clipboard className={className} />,
  },
  {
    label: "Telegram",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Clipboard className={className} />,
  },
  {
    label: "Twitter",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Twitter className={className} />,
  },
  {
    label: "Facebook",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Facebook className={className} />,
  },
  {
    label: "Email",
    href: "https://github.com/rajput-hemant/infinitunes",
    icon: ({ className }) => <Mail className={className} />,
  },
];

export const ShareOptions = ({ isDropDownItem, className }: Props) => {
  const Wrapper = isDropDownItem ? DropdownMenuItem : React.Fragment;

  return (
    <>
      {shareOptions.map(({ label, href, icon: Icon }, i) => {
        const AnchorOrButton = href ? "a" : CopyButton;

        return (
          <Wrapper key={i} asChild>
            <AnchorOrButton
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              isDropDownItem={isDropDownItem}
            >
              <Icon
                className={cn(
                  "mr-2 aspect-square h-5",
                  isDropDownItem && "h-4"
                )}
              />
              {label}
            </AnchorOrButton>
          </Wrapper>
        );
      })}
    </>
  );
};
