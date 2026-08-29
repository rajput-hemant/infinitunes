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
          <DialogTitle className="font-heading text-2xl font-normal drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
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
                  <div className="size-12 rounded-md bg-muted">
                    <List className="m-auto h-full" />
                  </div>
                  <div className="flex flex-col truncate">
                    <p className="truncate font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {songs.length ? songs.length : "No"} songs
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="h-full rounded-md border border-dashed p-2">
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-lg font-medium text-muted-foreground">
                <ListX size={40} />
                You do not have any playlist yet
              </div>
            </div>
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
