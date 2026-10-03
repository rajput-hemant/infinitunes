export async function register(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const { isLocalDatabase } = await import("@infinitunes/db/local-guard");
  if (!isLocalDatabase(databaseUrl)) return;

  const { getLocalDevFixture } = await import("@infinitunes/db/fixtures");
  const { user, database, redis } = getLocalDevFixture();

  const sections: Array<[string, Record<string, string | number>]> = [
    [
      "User",
      {
        Email: user.email,
        Password: user.password,
        Name: user.name,
        ID: user.id,
      },
    ],
    [
      "Database",
      {
        Host: database.host,
        Port: database.port,
        User: database.user,
        Password: database.password,
        Name: database.name,
        URL: database.url,
      },
    ],
    [
      "Redis",
      {
        Host: redis.host,
        Port: redis.port,
        "REST URL": redis.restUrl,
        "REST Token": redis.restToken,
      },
    ],
  ];

  console.log("\n[local-dev] Infinitunes local development credentials");
  for (const [title, fields] of sections) {
    console.log(`  ${title}`);
    for (const [key, value] of Object.entries(fields)) {
      console.log(`    ${`${key}:`.padEnd(12)} ${value}`);
    }
  }
  console.log("");
}
