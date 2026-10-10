import { Plus } from "lucide-react";

import { NewPlaylistForm } from "./new-playlist-form";

export function NewPlaylistCard() {
  return (
    <div className="w-full">
      <NewPlaylistForm>
        <button
          type="button"
          className="group flex w-full flex-col gap-2 rounded-md text-start"
        >
          <span className="grid aspect-square w-full place-items-center rounded-md border border-dashed text-muted-foreground transition-colors duration-fast group-hover:bg-fill">
            <Plus aria-hidden className="size-8" />
          </span>
          <span className="min-w-0">
            <b className="block truncate font-semibold text-foreground">
              New playlist
            </b>
            <small className="block truncate text-muted-foreground">
              Start a collection
            </small>
          </span>
        </button>
      </NewPlaylistForm>
    </div>
  );
}
