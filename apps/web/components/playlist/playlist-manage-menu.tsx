"use client";

import {
  deletePlaylistOptimistic,
  usePlaylistMeta,
} from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import type { MyPlaylist } from "@infinitunes/db/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@infinitunes/ui/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { unwrap } from "~/lib/action-result";
import { deletePlaylist } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

import { RenamePlaylistDialog } from "./rename-playlist-dialog";

type PlaylistManageMenuProps = {
  playlist: Pick<MyPlaylist, "id" | "name" | "description">;
  redirectOnDelete?: boolean;
  triggerClassName?: string;
};

export function PlaylistManageMenu({
  playlist: serverPlaylist,
  redirectOnDelete = false,
  triggerClassName,
}: PlaylistManageMenuProps) {
  const router = useRouter();
  // The dialogs start from, and the copy names, the name in force right now.
  const playlist = { ...serverPlaylist, ...usePlaylistMeta(serverPlaylist) };
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  function handleDelete() {
    // Gone from every list at once; a failure brings it back with a toast.
    setDeleteOpen(false);
    if (redirectOnDelete) router.push("/me");
    toast.promise(
      deletePlaylistOptimistic(playlist.id, () =>
        unwrap(deletePlaylist(playlist.id)),
      ),
      {
        loading: "Deleting playlist...",
        success: `Playlist "${playlist.name}" deleted`,
        error: userMessage,
      },
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Playlist options"
          className={cn(
            controlStyles.rowIcon,
            "inline-flex items-center justify-center outline-hidden transition-colors duration-fast hover:bg-fill focus-visible:ring-3 focus-visible:ring-ring/50",
            triggerClassName,
          )}
        >
          <MoreVertical aria-hidden className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="*:cursor-pointer">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil aria-hidden className="mr-2 size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden className="mr-2 size-4" />
            Delete playlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenamePlaylistDialog
        playlist={playlist}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{playlist.name}&quot; will be removed permanently. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={controlStyles.textLg}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              variant="destructive"
              className={cn(controlStyles.textLg, destructiveText)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
