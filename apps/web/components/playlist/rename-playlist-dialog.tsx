"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";
import * as React from "react";

// The form (zod, react-hook-form, validation) is fetched when the dialog
// first opens, not with every page that lists a playlist menu.
const RenamePlaylistForm = React.lazy(() =>
  import("./rename-playlist-form").then((m) => ({
    default: m.RenamePlaylistForm,
  })),
);

type RenamePlaylistDialogProps = {
  playlist: Pick<MyPlaylist, "id" | "name" | "description">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenamePlaylistDialog({
  playlist,
  open,
  onOpenChange,
}: RenamePlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="space-y-0">
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            Rename Playlist
          </DialogTitle>
          <DialogDescription>
            Update your playlist name and description.
          </DialogDescription>
        </DialogHeader>

        <React.Suspense fallback={null}>
          <RenamePlaylistForm
            playlist={playlist}
            onDone={() => onOpenChange(false)}
          />
        </React.Suspense>
      </DialogContent>
    </Dialog>
  );
}
