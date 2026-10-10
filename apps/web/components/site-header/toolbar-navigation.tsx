"use client";

import { Button } from "@infinitunes/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { GlassSurface } from "~/components/glass/glass-surface";
import { siteConfig } from "~/config/site";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { Icons } from "../icons";

const historyButtonClassName = cn(controlStyles.headerIcon, "rounded-full");

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

      <GlassSurface
        size="s"
        glassRole="toolbar"
        className={cn(
          "flex items-center rounded-full p-0.5",
          isHome && "max-md:hidden",
        )}
      >
        <Button
          variant="ghost"
          aria-label="Go back"
          onClick={() => router.back()}
          className={historyButtonClassName}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Button>

        <Button
          variant="ghost"
          aria-label="Go forward"
          onClick={() => router.forward()}
          className={cn(historyButtonClassName, "max-md:hidden")}
        >
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </GlassSurface>
    </div>
  );
}
