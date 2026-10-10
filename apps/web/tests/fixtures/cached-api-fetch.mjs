import { appendFileSync } from "node:fs";
// Test-only preload for next start; CATALOG_CACHE_TRACE points to a fresh trace file.
const trace = process.env.CATALOG_CACHE_TRACE;
if (!trace) throw new Error("CATALOG_CACHE_TRACE is required");
const originalFetch = globalThis.fetch;
const attempts = new Map();
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  if (url.hostname !== "www.jiosaavn.com") return originalFetch(input, init);
  const call = url.searchParams.get("__call");
  const p = url.searchParams.get("p");
  const key = call + ":" + p;
  const count = (attempts.get(key) ?? 0) + 1;
  attempts.set(key, count);
  appendFileSync(trace, JSON.stringify({ call, p, count }) + "\n");
  if (p === "9181" && count <= 2) return Response.json({}, { status: 503 });
  if (p === "9182" && count <= 2) {
    return new Promise((_, reject) =>
      init.signal.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      ),
    );
  }
  if (p === "9183" && count === 1) return new Response("invalid-json");
  if (call === "content.getCharts" || call === "content.getAlbums")
    return Response.json([
      {
        id: key,
        title: "Cache probe",
        perma_url: "https://www.jiosaavn.com/s/playlist/cache/probe",
        subtitle: "",
        type: "playlist",
        image: "https://c.saavncdn.com/000/test-500x500.jpg",
        explicit_content: "0",
      },
    ]);
  return originalFetch(input, init);
};
