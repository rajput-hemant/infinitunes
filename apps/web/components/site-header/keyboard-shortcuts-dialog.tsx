"use client";

import { Button } from "@infinitunes/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@infinitunes/ui/components/dialog";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { keyboardShortcuts } from "./keyboard-shortcuts";

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const keyCapClassName =
  "inline-grid h-5 min-w-5 place-items-center rounded-[calc(var(--r-sm)*0.5)] bg-fill px-1 text-[0.6875rem] leading-4 font-medium text-muted-foreground";

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-5 sm:max-w-md">
        <DialogTitle className="font-heading text-lg font-bold">
          Keyboard shortcuts
        </DialogTitle>

        <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-6 gap-y-3 text-sm">
          {keyboardShortcuts.map(({ keys, action }) => (
            <div key={action} className="contents">
              <dt className="flex items-center gap-1">
                {keys.map((key) => (
                  <kbd key={key} className={keyCapClassName}>
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd className="text-muted-foreground">{action}</dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-end">
          <DialogClose
            render={
              <Button
                type="button"
                className={cn(controlStyles.textLg, "text-sm")}
              />
            }
          >
            Done
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
