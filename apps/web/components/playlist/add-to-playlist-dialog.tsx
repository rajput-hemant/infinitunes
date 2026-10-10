"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";
import { List, ListX } from "lucide-react";

import { LibraryEmpty } from "~/components/library/library-section";
import { controlStyles } from "~/lib/control-styles";

import { NewPlaylistForm } from "./new-playlist-form";

type AddToPlaylistDialogProps = {
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  playlists?: MyPlaylist[];
  addToPlaylist: (id: string, name: string) => void;
};

export function AddToPlaylistDialog(props: AddToPlaylistDialogProps) {
  const { isDialogOpen, setDialogOpen, playlists, addToPlaylist } = props;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            Save to Playlist
          </DialogTitle>
        </DialogHeader>

        {playlists === undefined ? (
          // Unknown, not empty: the library read failed.
          <output className="block py-12 text-center text-muted-foreground">
            Couldn&apos;t load your playlists. You can still create a new one.
          </output>
        ) : playlists.length !== 0 ? (
          <div className="-mx-2 flex max-h-80 flex-col gap-1 overflow-y-auto">
            {playlists.map(({ id, name, songs }) => (
              <button
                key={id}
                type="button"
                onClick={() => addToPlaylist(id, name)}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-1 text-start transition-colors duration-fast hover:bg-fill-2 active:bg-fill-2"
              >
                <div className="grid size-art shrink-0 place-items-center rounded-[calc(var(--r-sm)*0.75)] bg-fill text-muted-foreground">
                  <List aria-hidden className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate font-medium" title={name}>
                    {name}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {songs.length === 0
                      ? "No songs"
                      : `${songs.length} ${songs.length === 1 ? "song" : "songs"}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <LibraryEmpty
            icon={ListX}
            title="No playlists yet"
            description="Create a playlist to start saving songs."
          />
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="secondary"
                className={controlStyles.textLg}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
            }
          />

          <NewPlaylistForm>
            <Button className={controlStyles.textLg}>
              Create New Playlist
            </Button>
          </NewPlaylistForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
