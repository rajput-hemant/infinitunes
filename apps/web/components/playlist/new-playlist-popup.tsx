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

type NewPlaylistPopupProps = {
  /** The single element that opens the dialog. */
  children: React.ReactElement;
  /** The trigger's `data-deferred` name, so focus can follow the swap. */
  name: string;
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
};

/** The real dialog (Dialog from 768px, Drawer below), loaded on intent by `NewPlaylistForm`. */
export function NewPlaylistPopup({
  children,
  name,
  defaultOpen = false,
}: NewPlaylistPopupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isPhone = useIsPhone();
  const onDone = () => setOpen(false);

  // Below 768px the mockup presents dialogs as bottom sheets.
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={children} data-deferred={name} />

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
      <DialogTrigger render={children} data-deferred={name} />

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
