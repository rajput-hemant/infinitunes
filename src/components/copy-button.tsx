"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Clipboard } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  isDropDownItem?: boolean;
  className?: string;
};

export const CopyButton = ({ isDropDownItem, className }: Props) => {
  const pathname = usePathname();
  const [isCopied, setIsCopied] = useState(false);

  function copy() {
    try {
      navigator.clipboard.writeText(`${siteConfig.url}/${pathname}`);
      setIsCopied(true);
    } catch (error) {
      console.error("Could not copy to clipboard", error);
    }
  }

  return (
    <button onClick={copy} className={className}>
      <Clipboard
        className={cn("mr-2 aspect-square h-5", isDropDownItem && "h-4")}
      />
      {isCopied ? "Copied 👍" : "Copy Link"}
    </button>
  );
};
