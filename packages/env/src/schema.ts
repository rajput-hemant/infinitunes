import { z } from "zod";

export interface EnvContext {
  nodeEnv?: string;
  vercel?: boolean;
  vercelUrl?: string;
}

function authSecret(ctx: EnvContext) {
  return ctx.nodeEnv === "production"
    ? z.string({ error: "Auth Secret is invalid or missing" })
    : z.string().optional();
}

function authUrl(ctx: EnvContext) {
  return z.preprocess(
    (str) => ctx.vercelUrl ?? str,
    ctx.vercel ? z.string() : z.string().url(),
  );
}

function requiredInProduction(ctx: EnvContext, message: string) {
  return ctx.nodeEnv === "production"
    ? z.string().min(1, { message })
    : z.string().optional();
}

/**
 * Server-only schemas. Secrets (OAuth client secrets, database URL) live here
 * and must never be imported by client code.
 */
export function createServerSchema(ctx: EnvContext = {}) {
  return {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    AUTH_SECRET: authSecret(ctx),
    AUTH_URL: authUrl(ctx),

    GOOGLE_CLIENT_ID: requiredInProduction(
      ctx,
      "Google Client ID is invalid or missing",
    ),
    GOOGLE_CLIENT_SECRET: requiredInProduction(
      ctx,
      "Google Client Secret is invalid or missing",
    ),

    GITHUB_CLIENT_ID: requiredInProduction(
      ctx,
      "Github Client ID is invalid or missing",
    ),
    GITHUB_CLIENT_SECRET: requiredInProduction(
      ctx,
      "Github Client Secret is invalid or missing",
    ),

    JIOSAAVN_DES_KEY: z
      .string()
      .optional()
      .describe(
        "DES key used to decrypt JioSaavn media URLs. Sourced from the environment only - never hardcoded.",
      ),

    DATABASE_URL: z
      .string()
      .min(1, { message: "Database URL is invalid or missing" }),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    ENABLE_RATE_LIMITING: z.enum(["true", "false"]).default("false"),
    RATE_LIMITING_REQUESTS_PER_SECOND: z.coerce.number().default(50),

    UMAMI_WEBSITE_ID: z.string().optional(),
  } as const;
}

export const clientSchema = {
  NEXT_PUBLIC_API_URL: z
    .string()
    .url({ message: "Public API URL is invalid or missing" })
    .optional()
    .describe(
      "Base URL of the public API, read from NEXT_PUBLIC_API_URL for the web app. A React Native app passes clientPrefix: 'EXPO_PUBLIC_' with its own EXPO_PUBLIC_API_URL client schema.",
    ),
} as const;

export const runtimeKeys = [
  "SKIP_ENV_VALIDATION",
  "NODE_ENV",
  "VERCEL",
  "VERCEL_URL",
] as const;
