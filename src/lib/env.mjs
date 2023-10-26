import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    JIOSAAVN_API_URL: z
      .string()
      .url({ message: "JioSaavn API URL is invalid or missing" }),

    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),

    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    GOOGLE_CLIENT_ID: z
      .string()
      .min(1, { message: "Google Client ID is invalid or missing" }),
    GOOGLE_CLIENT_SECRET: z
      .string()
      .min(1, { message: "Google Client Secret is invalid or missing" }),

    GITHUB_CLIENT_ID: z
      .string()
      .min(1, { message: "Github Client ID is invalid or missing" }),
    GITHUB_CLIENT_SECRET: z
      .string()
      .min(1, { message: "Github Client Secret is invalid or missing" }),

    DATABASE_URL: z
      .string()
      .min(1, { message: "Database URL is invalid or missing" }),
  },
  client: {
    NEXT_PUBLIC_JIOSAAVN_API_URL: z
      .string()
      .url({ message: "JioSaavn API URL is invalid or missing" }),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_JIOSAAVN_API_URL: process.env.NEXT_PUBLIC_JIOSAAVN_API_URL,
  },
});
