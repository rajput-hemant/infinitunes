/** A `fetch` stand-in: Bun's `typeof fetch` also requires `preconnect`. */
export function stubFetch(
  handler: (...args: Parameters<typeof fetch>) => Promise<Response>,
): typeof fetch {
  return Object.assign(handler, { preconnect: () => {} });
}
