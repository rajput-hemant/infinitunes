import type { ReactNode } from "react";

import { noindexMetadata } from "~/lib/metadata";

export const metadata = noindexMetadata;

/** Every `/me` page is the visitor's own library: keep it out of search. */
export default function MeLayout({ children }: { children: ReactNode }) {
  return children;
}
