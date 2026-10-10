"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { useIsPhone } from "~/components/site-header/use-is-phone";

// The form (zod, react-hook-form, validation) is fetched when the dialog
// first opens, not in the shell that every page loads.
const CreatePlaylistForm = React.lazy(() =>
  import("./create-playlist-form").then((m) => ({
    default: m.CreatePlaylistForm,
  })),
);

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

          <React.Suspense fallback={null}>
            <CreatePlaylistForm onDone={onDone} />
          </React.Suspense>
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

        <React.Suspense fallback={null}>
          <CreatePlaylistForm onDone={onDone} />
        </React.Suspense>
      </DialogContent>
    </Dialog>
  );
}
