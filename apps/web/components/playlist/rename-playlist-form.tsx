"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { userMessage } from "@infinitunes/core/user-message";
import { newPlaylistSchema } from "@infinitunes/core/validations";
import type { MyPlaylist } from "@infinitunes/db/schema";
import { Button } from "@infinitunes/ui/components/button";
import { DialogClose, DialogFooter } from "@infinitunes/ui/components/dialog";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { unwrap } from "~/lib/action-result";
import { renamePlaylist } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { renamePlaylistOptimistic } from "~/lib/optimistic-playlists";

import { PlaylistFields } from "./playlist-fields";

type PlaylistFormData = z.infer<typeof newPlaylistSchema>;

type RenamePlaylistFormProps = {
  playlist: Pick<MyPlaylist, "id" | "name" | "description">;
  onDone: () => void;
};

/**
 * Mounted inside the dialog's content, so it is created fresh each time the
 * dialog opens and starts from the playlist's current values.
 */
export function RenamePlaylistForm({
  playlist,
  onDone,
}: RenamePlaylistFormProps) {
  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues: {
      name: playlist.name,
      description: playlist.description ?? "",
    },
  });

  function onSubmit({ name, description }: PlaylistFormData) {
    // Shown renamed everywhere at once; a failure restores the old name.
    onDone();
    toast.promise(
      renamePlaylistOptimistic(playlist.id, { name, description }, () =>
        unwrap(renamePlaylist(playlist.id, { name, description })),
      ),
      {
        loading: "Renaming playlist...",
        success: () => `Playlist renamed to "${name}"`,
        error: userMessage,
      },
    );
  }

  return (
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
  );
}
