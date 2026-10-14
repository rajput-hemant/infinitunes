import { Button } from "@infinitunes/ui/components/button";
import { Fingerprint, Loader2, Trash2 } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";
import { cn, destructiveText } from "~/lib/utils";

export type PasskeyRow = {
  id: string;
  name?: string | null;
};

type PasskeyListProps = {
  passkeys: readonly PasskeyRow[];
  deletingId: string | null;
  onRemove: (id: string) => void;
};

export function PasskeyList(props: PasskeyListProps) {
  const { passkeys, deletingId, onRemove } = props;

  return (
    <ul className="grid max-w-2xl gap-2">
      {passkeys.map((passkey) => {
        const label = passkey.name || "Passkey";

        return (
          <li
            key={passkey.id}
            className="flex items-center justify-between gap-4 rounded-md border border-line bg-card px-4 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Fingerprint
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate text-sm font-medium">{label}</span>
            </span>
            <Button
              type="button"
              variant="destructive"
              aria-label={`Remove ${label}`}
              className={cn(controlStyles.text, destructiveText)}
              disabled={deletingId !== null}
              onClick={() => onRemove(passkey.id)}
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
        );
      })}
    </ul>
  );
}
