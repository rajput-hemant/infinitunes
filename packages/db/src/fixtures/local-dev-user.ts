import { existsSync, readFileSync } from "node:fs";

import { z } from "zod";

import canonicalFixture from "../../../../local-dev/fixtures.json";

const text = z.string().min(1);
const strings = z.array(z.string());

const fixtureSchema = z.object({
  version: text,
  description: text,
  database: z.object({
    host: text,
    port: z.number().int(),
    user: text,
    password: text,
    name: text,
    url: text,
  }),
  redis: z.object({
    host: text,
    port: z.number().int(),
    restUrl: text,
    restToken: text,
  }),
  user: z.object({
    id: text,
    email: text,
    password: text,
    name: text,
    emailVerified: z.boolean(),
  }),
  infinitunes: z.object({
    playlists: z.array(
      z.object({
        id: text,
        name: text,
        description: text,
        songs: strings,
      }),
    ),
    favorites: z.object({
      id: text,
      songs: strings,
      albums: strings,
      playlists: strings,
      artists: strings,
      podcasts: strings,
    }),
  }),
});

export type LocalDevFixture = z.infer<typeof fixtureSchema>;

const DEFAULT_LOCAL_DEV_FIXTURE = parseLocalDevFixture(canonicalFixture);

/** Validates a parsed fixture; throws on any missing or mistyped field. */
export function parseLocalDevFixture(input: unknown): LocalDevFixture {
  const result = fixtureSchema.safeParse(input);
  if (!result.success) {
    const problems = result.error.issues
      .map((i) => `"${i.path.join(".") || "$"}": ${i.message}`)
      .join("; ");
    throw new Error(
      `[local-dev] Invalid LOCAL_DEV_CONFIG fixture: ${problems}`,
    );
  }
  return result.data;
}

/**
 * Loads the shared local-dev fixture. With LOCAL_DEV_CONFIG set, that file is
 * read and validated and any failure throws (no silent fallback). Otherwise
 * the bundled canonical `local-dev/fixtures.json` is used.
 */
export function getLocalDevFixture(
  configPath = process.env.LOCAL_DEV_CONFIG,
): LocalDevFixture {
  if (!configPath) return DEFAULT_LOCAL_DEV_FIXTURE;
  if (!existsSync(configPath)) {
    throw new Error(
      `[local-dev] LOCAL_DEV_CONFIG points to a missing file: ${configPath}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (err) {
    throw new Error(
      `[local-dev] LOCAL_DEV_CONFIG is not valid JSON: ${configPath} (${(err as Error).message})`,
    );
  }
  return parseLocalDevFixture(parsed);
}
