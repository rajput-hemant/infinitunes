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
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

type Props = {
  theme?: ThemeProviderProps;
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
});

export default function Providers({ children, theme }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...theme}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>

      <Toaster />
    </ThemeProvider>
  );
}
