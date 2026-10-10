"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { MyPlaylist } from "@infinitunes/db/schema";
import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { unwrap } from "~/lib/action-result";
import { renamePlaylist } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { userMessage } from "~/lib/user-message";
import { newPlaylistSchema } from "~/lib/validations";

import { PlaylistFields } from "./playlist-fields";

type FormData = z.infer<typeof newPlaylistSchema>;

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
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues: {
      name: playlist.name,
      description: playlist.description ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: playlist.name,
        description: playlist.description ?? "",
      });
    }
  }, [open, playlist.name, playlist.description, form]);

  async function onSubmit({ name, description }: FormData) {
    try {
      await toast.promise(
        unwrap(renamePlaylist(playlist.id, { name, description })),
        {
          loading: "Renaming playlist...",
          success: (updated) => `Playlist renamed to "${updated.name}"`,
          error: userMessage,
        },
      );
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }

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

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <PlaylistFields control={form.control} />

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant="secondary"
                  type="button"
                  className={controlStyles.textLg}
                >
                  Cancel
                </Button>
              }
            />
            <Button type="submit" className={controlStyles.textLg}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
