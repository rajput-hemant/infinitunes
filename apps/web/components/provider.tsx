"use client";

import { Toaster } from "@infinitunes/ui/components/sonner";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { AudioPlayerProvider } from "react-use-audio-player";

import { ThemeConfigProvider } from "~/lib/theme/provider";

import { ThemeColorSync } from "./theme-color-sync";

// Defined in globals.css: clears the fixed player bar and, below lg, the mobile nav.
const TOAST_BOTTOM_OFFSET = "var(--toast-offset-bottom)";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

export default function Providers({ children, theme }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // `lib/theme-script.ts` already sets the class before paint; a
      // non-executable type keeps next-themes' own copy out of CSP's way.
      scriptProps={{ type: "application/json" }}
      {...theme}
    >
      <ThemeConfigProvider>
        <ThemeColorSync />
        <AudioPlayerProvider>
          <TooltipProvider>{children}</TooltipProvider>

          <Toaster
            offset={{ bottom: TOAST_BOTTOM_OFFSET }}
            mobileOffset={{ bottom: TOAST_BOTTOM_OFFSET }}
          />
        </AudioPlayerProvider>
      </ThemeConfigProvider>
    </ThemeProvider>
  );
}
