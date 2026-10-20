"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { userMessage } from "@infinitunes/core/user-message";
import { newPlaylistSchema } from "@infinitunes/core/validations";
import { Button } from "@infinitunes/ui/components/button";
import { DialogClose, DialogFooter } from "@infinitunes/ui/components/dialog";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { unwrap } from "~/lib/action-result";
import { createNewPlaylist } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { createPlaylistOptimistic } from "~/lib/optimistic-playlists";

import { PlaylistFields } from "./playlist-fields";

type PlaylistFormData = z.infer<typeof newPlaylistSchema>;

const defaultValues: PlaylistFormData = {
  name: "",
  description: "",
};

type CreatePlaylistFormProps = {
  onDone: () => void;
};

/**
 * Loaded on first open of the dialog (see `new-playlist-form.tsx`), so zod,
 * react-hook-form and the form validation stay out of the shared shell.
 * Mounted inside the dialog's content, so it is created fresh each time the
 * dialog opens and never shows the previous attempt's values.
 */
export function CreatePlaylistForm({ onDone }: CreatePlaylistFormProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues,
  });

  // The popup focuses its first tabbable element when it opens, which is
  // this form's name field. The form mounts a moment later (lazy load), so
  // move focus to the name field here to keep that behaviour.
  React.useEffect(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>('input[type="text"]')
      ?.focus();
  }, []);

  function onSubmit({ name, description }: PlaylistFormData) {
    // The id comes from the database, so the row is added as pending and the
    // dialog closes now instead of after the round trip.
    onDone();
    toast.promise(
      createPlaylistOptimistic({ name, description }, () =>
        unwrap(createNewPlaylist({ name, description })),
      ),
      {
        loading: "Creating playlist...",
        success: (d) => `Playlist "${d.name}" created successfully!`,
        error: userMessage,
      },
    );
  }

  return (
    <form
      ref={formRef}
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
          Create Playlist
        </Button>
      </DialogFooter>
    </form>
  );
}
