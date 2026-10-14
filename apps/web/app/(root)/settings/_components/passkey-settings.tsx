"use client";

import { authClient } from "@infinitunes/auth/client";
import { Button } from "@infinitunes/ui/components/button";
import { Loader2, Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { controlStyles } from "~/lib/control-styles";

import { PasskeyList } from "./passkey-list";
import type { PasskeyRow } from "./passkey-list";
import { SettingsSection } from "./settings-section";

const LOAD_ERROR = "Could not load passkeys.";

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Resolves to null on failure, so the caller keeps the list it already shows. */
async function listPasskeys(): Promise<PasskeyRow[] | null> {
  try {
    const { data, error } = await authClient.passkey.listUserPasskeys();
    if (error) {
      toast.error(error.message ?? LOAD_ERROR);
      return null;
    }
    return data ?? [];
  } catch (error) {
    console.error(messageOf(error, LOAD_ERROR));
    toast.error(LOAD_ERROR);
    return null;
  }
}

export function PasskeySettings() {
  const [passkeys, setPasskeys] = React.useState<PasskeyRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    const next = await listPasskeys();
    if (next) setPasskeys(next);
    setIsLoading(false);
  }

  React.useEffect(() => {
    let cancelled = false;
    listPasskeys().then((next) => {
      if (cancelled) return;
      if (next) setPasskeys(next);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addPasskey() {
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
      console.error(messageOf(error, "Could not add passkey."));
      toast.error("Could not add passkey.");
    } finally {
      setIsAdding(false);
    }
  }

  async function removePasskey(id: string) {
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
      console.error(messageOf(error, "Could not remove passkey."));
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
        <PasskeyList
          passkeys={passkeys}
          deletingId={deletingId}
          onRemove={removePasskey}
        />
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={isAdding || isLoading}
          onClick={addPasskey}
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
