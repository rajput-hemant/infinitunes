"use client";

import { userMessage } from "@infinitunes/core/user-message";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@infinitunes/ui/components/alert-dialog";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { Input } from "@infinitunes/ui/components/input";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { unwrap } from "~/lib/action-result";
import { deleteUser } from "~/lib/actions";
import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

import { SettingsCard } from "./settings-card";
import { SettingsRow } from "./settings-row";

export function DeleteAccountSection() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState("");
  const [deletePassword, setDeletePassword] = React.useState("");

  function deleteUserHandler() {
    const deletion = unwrap(deleteUser(deletePassword || undefined)).then(
      () => {
        // The session row is gone with the user; leave the stale signed-in page.
        router.replace("/");
        router.refresh();
      },
    );

    toast.promise(deletion, {
      loading: "Deleting Account...",
      success: "Account Deleted! Logging out...",
      error: userMessage,
    });
  }

  return (
    <SettingsCard title="Danger zone" tone="danger">
      <SettingsRow
        id="delete"
        label="Delete account"
        help="Permanently delete your account and all its associated data. This cannot be undone."
        keywords="danger zone remove erase"
      >
        <AlertDialog
          onOpenChange={(open) => {
            // Do not keep the typed password around after the dialog closes.
            if (!open) {
              setDeletePassword("");
              setConfirmDelete("");
            }
          }}
        >
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                className={cn(controlStyles.textLg, destructiveText)}
              >
                <Trash2 aria-hidden className="size-4" />
                Delete Account
              </Button>
            }
          />

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Once you delete your account, there is no going back. Please be
                certain. Accounts without a password (passkey or OAuth) can
                leave the password blank if they signed in within the last 10
                minutes; otherwise sign in again first.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Input
              type="password"
              autoComplete="current-password"
              aria-label="Your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password (if you have one)"
              className={controlStyles.text}
            />
            <Input
              type="text"
              autoComplete="off"
              aria-label="Type DELETE MY ACCOUNT to confirm"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="Type DELETE MY ACCOUNT to confirm!"
              className={controlStyles.text}
            />

            <AlertDialogFooter>
              <AlertDialogCancel className={controlStyles.text}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteUserHandler}
                disabled={confirmDelete !== "DELETE MY ACCOUNT"}
                className={cn(
                  buttonVariants({ variant: "destructive" }),
                  controlStyles.text,
                  destructiveText,
                )}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsRow>
    </SettingsCard>
  );
}
