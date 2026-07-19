"use client";

import type { AppRouter } from "@infinitunes/trpc/types";
import { createTRPCReact } from "@trpc/react-query";

export const api = createTRPCReact<AppRouter>();
