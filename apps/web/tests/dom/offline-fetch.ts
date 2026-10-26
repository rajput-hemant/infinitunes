import { stubFetch } from "../fetch-stub";

/**
 * `fetch` for a tRPC client under test: answers every request with a 503
 * without opening a socket, so a query that fires fails the same way each time
 * instead of racing a real connection to a port nothing listens on.
 */
export const offlineFetch: typeof fetch = stubFetch(
  async () => new Response("offline", { status: 503 }),
);
