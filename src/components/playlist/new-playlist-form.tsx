"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { User } from "next-auth";
import type { z } from "zod";

import { createNewPlaylist } from "@/lib/actions";
import { newPlaylistSchema } from "@/lib/validations";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const defaultValues: FormData = {
  name: "",
  description: "",
};

type FormData = z.infer<typeof newPlaylistSchema>;

type NewPlaylistFormProps = {
  user?: User;
  children: React.ReactNode;
};

export function NewPlaylistForm({ user, children }: NewPlaylistFormProps) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(newPlaylistSchema),
    defaultValues,
  });

  async function onSubmit({ name, description }: FormData) {
    try {
      toast.promise(
        createNewPlaylist({ name, description, userId: user!.id! }),
        {
          loading: "Creating playlist...",
          success: (d) => `Playlist "${d.name}" created successfully!`,
          error: (e) => e.message,
          finally: () => setOpen(false),
        }
      );
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader className="space-y-0">
          <DialogTitle className="font-heading text-2xl tracking-wide drop-shadow-md">
            Create Playlist
          </DialogTitle>
          <DialogDescription>
            Create a new playlist to add your favorite songs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Playlist Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      required
                      placeholder="Enter playlist name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Description</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter playlist description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button size="sm" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm">
                Create Playlist
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
