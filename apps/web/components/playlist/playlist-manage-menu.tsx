"use client";

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
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { unwrapAction } from "~/lib/action-result";
import { deletePlaylist } from "~/lib/actions";
import { userMessage } from "~/lib/user-message";
import { cn } from "~/lib/utils";

import { RenamePlaylistDialog } from "./rename-playlist-dialog";

type PlaylistManageMenuProps = {
  playlist: Pick<MyPlaylist, "id" | "name" | "description">;
  redirectOnDelete?: boolean;
  triggerClassName?: string;
};

export function PlaylistManageMenu({
  playlist,
  redirectOnDelete = false,
  triggerClassName,
}: PlaylistManageMenuProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  async function handleDelete() {
    try {
      await toast.promise(unwrapAction(deletePlaylist(playlist.id)), {
        loading: "Deleting playlist...",
        success: `Playlist "${playlist.name}" deleted`,
        error: userMessage,
      });
      setDeleteOpen(false);
      if (redirectOnDelete) {
        router.push("/me");
      }
      router.refresh();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Playlist options"
          className={cn(
            "rounded-md outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
            triggerClassName,
          )}
        >
          <MoreVertical aria-hidden className="size-6 hover:text-primary" />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
