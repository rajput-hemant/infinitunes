import { z } from "zod";

export const clientSchema = {
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url({ message: "Public App URL is invalid or missing" })
    .default("https://infinitunes.rajputhemant.me")
    .describe(
      "Public URL of the application, read from NEXT_PUBLIC_APP_URL for the web app.",
    ),
} as const;
