import { expect, it } from "bun:test";

import type { DbClient } from "@infinitunes/db/client";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

import { publicProcedure, router } from "../src/trpc";

it("returns the first validation issue as the HTTP error message", async () => {
  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req: new Request("http://localhost/trpc/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: { name: "" } }),
    }),
    router: router({
      save: publicProcedure
        .input(z.object({ name: z.string().min(1, "Enter a playlist name") }))
        .mutation(() => "saved"),
    }),
    createContext: () => ({ db: {} as DbClient, session: null }),
  });
  const body = await response.json();
  expect(response.status).toBe(400);
  expect(body.error.json.message).toBe("Enter a playlist name");
  expect(body.error.json.data.code).toBe("BAD_REQUEST");
});
