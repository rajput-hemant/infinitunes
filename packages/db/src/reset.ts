import postgres from "postgres";

import { LOCAL_DEV_DATABASE } from "./fixtures/local-dev-user";

async function reset() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[db:reset] ABORTED: Cannot reset database in production mode!",
    );
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL || LOCAL_DEV_DATABASE.url;

  // Safety check on URL
  if (
    !databaseUrl.includes("localhost") &&
    !databaseUrl.includes("127.0.0.1")
  ) {
    console.error(
      "[db:reset] ABORTED: Target DATABASE_URL does not look like a local development database!",
    );
    process.exit(1);
  }

  console.log(
    `[db:reset] Resetting schema on local database: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`,
  );

  const client = postgres(databaseUrl, { max: 1 });

  try {
    await client.begin(async (tx) => {
      // Drop public tables with CASCADE safely
      await tx`DROP SCHEMA public CASCADE;`;
      await tx`CREATE SCHEMA public;`;
      await tx`GRANT ALL ON SCHEMA public TO postgres;`;
      await tx`GRANT ALL ON SCHEMA public TO public;`;
    });
    console.log("[db:reset] Clean public schema recreated successfully.");
  } finally {
    await client.end();
  }
}

if (import.meta.main) {
  reset().catch((err) => {
    console.error("[db:reset] Error during reset:", err);
    process.exit(1);
  });
}
