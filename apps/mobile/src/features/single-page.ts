/**
 * A catalog list that upstream answers in one page, as `CatalogScreen`'s
 * query: the items (none while loading) beside the query's own state.
 */
export function singlePage<Item, Query extends { data: Item[] | undefined }>(
  query: Query & { data: Item[] | undefined },
) {
  return { ...query, items: query.data ?? [] };
}
