"use client";

import { Button } from "@infinitunes/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { siteConfig } from "~/config/site";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { Icons } from "../icons";

/**
 * Leading toolbar controls. From tablet up the sidebar carries the brand, so
 * the toolbar has history buttons. On a phone, the home route shows the brand
 * and every other route swaps it for a back button.
 */
export function ToolbarNavigation() {
  const router = useRouter();
  const isHome = usePathname() === "/";

  return (
    <div className="flex items-center gap-1">
      {isHome && (
        <Link
          href="/"
          className="flex items-center gap-1 pl-2 font-heading lowercase md:hidden"
        >
          <Icons.Logo className="size-4" />
          {siteConfig.name}
        </Link>
      )}

      <Button
        variant="ghost"
        aria-label="Go back"
        onClick={() => router.back()}
        className={cn(controlStyles.headerIcon, isHome && "max-md:hidden")}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </Button>

      <Button
        variant="ghost"
        aria-label="Go forward"
        onClick={() => router.forward()}
        className={cn(controlStyles.headerIcon, "max-md:hidden")}
      >
        <ChevronRight aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
