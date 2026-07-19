"use client";

if (process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return;
    }
    originalError(...args);
  };
}

import { Toaster } from "@infinitunes/ui/components/sonner";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import superjson from "superjson";

import { api } from "~/lib/trpc/client";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
});

function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const trpcClient = api.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        maxURLLength: 2083,
        transformer: superjson,
      }),
    ],
  });

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
      {...theme}
    >
      <TRPCReactProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </TRPCReactProvider>

      <Toaster />
    </ThemeProvider>
  );
}
