/** Rows and queue entries both carry an already decoded `name`. */
export function getItemName(item: { name: string }): string {
  return item.name;
}
