"use client";

import { Toaster } from "@infinitunes/ui/components/sonner";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useState } from "react";
import { AudioPlayerProvider } from "react-use-audio-player";
import superjson from "superjson";

import { api } from "~/lib/trpc/client";

import { ThemeColorSync } from "./theme-color-sync";

// Defined in globals.css: clears the fixed player bar and, below lg, the mobile nav.
const TOAST_BOTTOM_OFFSET = "var(--toast-offset-bottom)";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // The server must never share a client across concurrent requests.
  if (typeof window === "undefined") return makeQueryClient();

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          maxURLLength: 2083,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}

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
      <ThemeColorSync />
      <AudioPlayerProvider>
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>

        <Toaster
          offset={{ bottom: TOAST_BOTTOM_OFFSET }}
          mobileOffset={{ bottom: TOAST_BOTTOM_OFFSET }}
        />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}
