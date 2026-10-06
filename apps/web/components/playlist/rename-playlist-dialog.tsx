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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { unwrap } from "~/lib/action-result";
import { renamePlaylist } from "~/lib/actions";
import { userMessage } from "~/lib/user-message";
import { newPlaylistSchema } from "~/lib/validations";

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
          <DialogTitle className="font-heading text-2xl tracking-wide dark:drop-shadow-md">
            Rename Playlist
          </DialogTitle>
          <DialogDescription>
            Update your playlist name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical">
                <FieldLabel className="text-xs">
                  Playlist Name{" "}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    required
                    placeholder="Enter playlist name"
                    {...field}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical">
                <FieldLabel className="text-xs">Description</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="Enter playlist description"
                    {...field}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter className="pt-4">
            <DialogClose
              render={
                <Button size="sm" variant="secondary" type="button">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" size="sm">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
