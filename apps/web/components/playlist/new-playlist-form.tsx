"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@infinitunes/ui/components/dialog";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { unwrap } from "~/lib/action-result";
import { createNewPlaylist } from "~/lib/actions";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { userMessage } from "~/lib/user-message";
import { newPlaylistSchema } from "~/lib/validations";

import { PlaylistFields } from "./playlist-fields";

const defaultValues: FormData = {
  name: "",
  description: "",
};

type FormData = z.infer<typeof newPlaylistSchema>;

type NewPlaylistFormProps = {
  user?: User;
  children: React.ReactNode;
};

export function NewPlaylistForm({ children }: NewPlaylistFormProps) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues,
  });

  async function onSubmit({ name, description }: FormData) {
    try {
      toast.promise(unwrap(createNewPlaylist({ name, description })), {
        loading: "Creating playlist...",
        success: (d) => `Playlist "${d.name}" created successfully!`,
        error: userMessage,
        finally: () => setOpen(false),
      });
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />

      <DialogContent>
        <DialogHeader className="space-y-0">
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            Create Playlist
          </DialogTitle>
          <DialogDescription>
            Create a new playlist to add your favorite songs.
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
                <Button variant="secondary" className={controlStyles.textLg}>
                  Cancel
                </Button>
              }
            />
            <Button type="submit" className={controlStyles.textLg}>
              Create Playlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
