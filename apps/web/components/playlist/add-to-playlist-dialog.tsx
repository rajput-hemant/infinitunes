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
import { Separator } from "@infinitunes/ui/components/separator";
import { List, ListX } from "lucide-react";

import { LibraryEmpty } from "~/components/library/library-section";
import type { User } from "~/lib/auth";

import { NewPlaylistForm } from "./new-playlist-form";

type AddToPlaylistDialogProps = {
  user?: User;
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  playlists?: MyPlaylist[];
  addToPlaylist: (id: string, name: string) => void;
};

export function AddToPlaylistDialog(props: AddToPlaylistDialogProps) {
  const { user, isDialogOpen, setDialogOpen, playlists, addToPlaylist } = props;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-xl shadow-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
            Save to Playlist
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="min-h-64">
          {playlists?.length !== 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {playlists?.map(({ id, name, songs }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => addToPlaylist(id, name)}
                  className="h-14 justify-normal gap-2 px-1 text-start"
                >
                  {/* TODO: add image collage */}
                  <div className="size-12 shrink-0 rounded-md bg-muted">
                    <List aria-hidden className="m-auto h-full" />
                  </div>
                  <div className="flex flex-col truncate">
                    <p className="truncate font-medium" title={name}>
                      {name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {songs.length === 0
                        ? "No songs"
                        : `${songs.length} ${songs.length === 1 ? "song" : "songs"}`}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <LibraryEmpty
              icon={ListX}
              title="No playlists yet"
              description="Create a playlist to start saving songs."
              className="min-h-64 lg:min-h-64"
            />
          )}
        </div>

        <Separator />

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            }
          />

          <NewPlaylistForm user={user}>
            <Button className="shadow-sm">Create New Playlist</Button>
          </NewPlaylistForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
