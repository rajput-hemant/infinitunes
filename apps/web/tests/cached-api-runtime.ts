import assert from "node:assert/strict";

// Run against next start with fixtures/cached-api-fetch.mjs preloaded and a fresh trace file.
const [baseUrl, trace] = process.argv.slice(2);
assert(
  baseUrl && trace,
  "Usage: bun apps/web/tests/cached-api-runtime.ts <base-url> <trace-file>",
);

async function request(procedure: string, page: number, lang = "hindi") {
  const url = new URL(`/api/trpc/${procedure}`, baseUrl);
  url.searchParams.set("input", JSON.stringify({ json: { page, n: 1, lang } }));
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

async function count(call: string, page: number) {
  const lines = (await Bun.file(trace).text()).trim().split("\n");
  return lines
    .map((line) => JSON.parse(line))
    .filter((entry) => entry.call === call && entry.p === String(page)).length;
}

assert.equal((await request("get.charts", 9180)).status, 200);
assert.equal((await request("get.charts", 9180)).status, 200);
assert.equal(
  await count("content.getCharts", 9180),
  1,
  "identical endpoint and arguments must hit the cache",
);
assert.equal((await request("get.charts", 9184)).status, 200);
assert.equal(
  await count("content.getCharts", 9184),
  1,
  "different page must have a separate cache entry",
);
assert.equal((await request("get.charts", 9180, "tamil")).status, 200);
assert.equal(
  await count("content.getCharts", 9180),
  2,
  "different language must have a separate cache entry",
);
assert.equal((await request("get.topAlbums", 9180)).status, 200);
assert.equal(
  await count("content.getAlbums", 9180),
  1,
  "different endpoint must have a separate cache entry",
);

const badGateway = await request("get.charts", 9181);
assert.equal(badGateway.status, 502);
assert.equal(badGateway.body.error.json.data.code, "BAD_GATEWAY");
assert.equal((await request("get.charts", 9181)).status, 200);
assert.equal(
  await count("content.getCharts", 9181),
  3,
  "a failed cache fill must retry upstream on the next request",
);

const invalidJson = await request("get.charts", 9183);
assert.equal(invalidJson.status, 502);
assert.equal(
  invalidJson.body.error.json.message,
  "Invalid JSON response from upstream",
);
assert.equal((await request("get.charts", 9183)).status, 200);
assert.equal(
  await count("content.getCharts", 9183),
  2,
  "invalid JSON must not be retried or cached",
);

const timeout = await request("get.charts", 9182);
assert.equal(timeout.status, 408);
assert.equal(timeout.body.error.json.data.code, "TIMEOUT");
assert.equal((await request("get.charts", 9182)).status, 200);
assert.equal(
  await count("content.getCharts", 9182),
  3,
  "timeouts must not be cached",
);
console.log(
  "Compiled catalog cache: keys, failure recovery, invalid JSON and TIMEOUT passed.",
);
