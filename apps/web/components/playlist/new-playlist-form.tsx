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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@infinitunes/ui/components/drawer";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useIsPhone } from "~/components/site-header/use-is-phone";
import { unwrap } from "~/lib/action-result";
import { createNewPlaylist } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { userMessage } from "~/lib/user-message";
import { newPlaylistSchema } from "~/lib/validations";

import { PlaylistFields } from "./playlist-fields";

type PlaylistFormData = z.infer<typeof newPlaylistSchema>;

const defaultValues: PlaylistFormData = {
  name: "",
  description: "",
};

type NewPlaylistFormProps = {
  /** The single element that opens the dialog. */
  children: React.ReactElement;
};

export function NewPlaylistForm({ children }: NewPlaylistFormProps) {
  const [open, setOpen] = React.useState(false);
  const isPhone = useIsPhone();
  const onDone = () => setOpen(false);

  // Below 768px the mockup presents dialogs as bottom sheets.
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={children} />

        <DrawerContent className="gap-4 rounded-t-3xl p-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-1">
            <DrawerTitle className="font-heading text-xl font-bold tracking-tight">
              Create Playlist
            </DrawerTitle>
            <DrawerDescription>
              Create a new playlist to add your favorite songs.
            </DrawerDescription>
          </div>

          <CreatePlaylistForm onDone={onDone} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />

      <DialogContent>
        <DialogHeader className="space-y-0">
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            Create Playlist
          </DialogTitle>
          <DialogDescription>
            Create a new playlist to add your favorite songs.
          </DialogDescription>
        </DialogHeader>

        <CreatePlaylistForm onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}

type CreatePlaylistFormProps = {
  onDone: () => void;
};

/**
 * Mounted inside the dialog's content, so it is created fresh each time the
 * dialog opens and never shows the previous attempt's values.
 */
function CreatePlaylistForm({ onDone }: CreatePlaylistFormProps) {
  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues,
  });

  function onSubmit({ name, description }: PlaylistFormData) {
    toast.promise(unwrap(createNewPlaylist({ name, description })), {
      loading: "Creating playlist...",
      success: (d) => `Playlist "${d.name}" created successfully!`,
      error: userMessage,
      finally: onDone,
    });
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
          Create Playlist
        </Button>
      </DialogFooter>
    </form>
  );
}
