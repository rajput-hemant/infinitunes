/** What a library list screen renders: one of three states. */
export type LibraryList<Item> =
  | { status: "loading" }
  | { status: "error"; error: unknown; retry: () => void }
  | {
      status: "ready";
      items: Item[];
      /** Saved entries the music service could not resolve right now. */
      missing: number;
      refreshing: boolean;
      /** Pull to refresh; a failure shows a toast and keeps the list. */
      refresh: () => void;
    };
