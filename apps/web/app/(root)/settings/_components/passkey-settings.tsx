"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

import { SettingsSection } from "./settings-section";

type Passkey = {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
};

export function PasskeySettings() {
  const [passkeys, setPasskeys] = React.useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.passkey.listUserPasskeys();
      if (error) {
        toast.error(error.message ?? "Could not load passkeys.");
      } else {
        setPasskeys((data ?? []) as Passkey[]);
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Could not load passkeys.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    authClient.passkey
      .listUserPasskeys()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error(error.message ?? "Could not load passkeys.");
        } else {
          setPasskeys((data ?? []) as Passkey[]);
        }
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error((error as Error).message);
        toast.error("Could not load passkeys.");
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addPasskeyHandler() {
    setIsAdding(true);
    try {
      const { error } = await authClient.passkey.addPasskey();
      if (error) {
        if (error.message?.toLowerCase().includes("cancel")) {
          toast.info("Passkey enrollment was cancelled.");
        } else {
          toast.error(error.message ?? "Could not add passkey.");
        }
      } else {
        toast.success("Passkey added.");
        await refresh();
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Could not add passkey.");
    } finally {
      setIsAdding(false);
    }
  }

  async function deletePasskeyHandler(id: string) {
    setDeletingId(id);
    try {
      const { error } = await authClient.passkey.deletePasskey({ id });
      if (error) {
        toast.error(error.message ?? "Could not remove passkey.");
      } else {
        toast.success("Passkey removed.");
        setPasskeys((current) => current.filter((key) => key.id !== id));
      }
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Could not remove passkey.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SettingsSection
      id="passkeys"
      title="Passkeys"
      description="Sign in without a password using your device. Adding a passkey requires you to be signed in."
    >
      {isLoading ? (
        <output className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2
            aria-hidden
            className="size-4 animate-spin motion-reduce:animate-none"
          />{" "}
          Loading passkeys...
        </output>
      ) : passkeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No passkeys yet. Add one to enable passwordless sign-in.
        </p>
      ) : (
        <ul className="grid max-w-2xl gap-2">
          {passkeys.map((passkey) => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-4 rounded-md border border-line bg-card px-4 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Fingerprint
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate text-sm font-medium">
                  {passkey.name || "Passkey"}
                </span>
              </span>
              <Button
                type="button"
                variant="destructive"
                className={cn(controlStyles.text, destructiveText)}
                disabled={deletingId !== null}
                onClick={() => deletePasskeyHandler(passkey.id)}
              >
                {deletingId === passkey.id ? (
                  <Loader2
                    aria-hidden
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Trash2 aria-hidden className="size-4" />
                )}
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={isAdding || isLoading}
          onClick={addPasskeyHandler}
          className={controlStyles.textLg}
        >
          {isAdding ? (
            <Loader2
              aria-hidden
              className="mr-2 size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Plus aria-hidden className="mr-2 size-4" />
          )}
          Add Passkey
        </Button>
      </div>
    </SettingsSection>
  );
}
