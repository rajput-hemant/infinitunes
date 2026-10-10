import { Switch } from "@infinitunes/ui/components/switch";
import React from "react";

import { cn } from "~/lib/utils";

type SettingsRowProps = {
  id?: string;
  label: string;
  labelId?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SettingsRow(props: SettingsRowProps) {
  const { id, label, labelId, help, children, className } = props;

  return (
    <div
      id={id}
      className={cn(
        "flex max-w-2xl scroll-mt-20 flex-wrap items-center justify-between gap-4 border-b border-line py-4 last:border-b-0",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p id={labelId} className="text-sm/5 font-semibold">
          {label}
        </p>
        {help && (
          <p className="max-w-104 text-xs/4 text-muted-foreground">{help}</p>
        )}
      </div>

      {children}
    </div>
  );
}

type SwitchRowProps = {
  label: string;
  help?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchRow(props: SwitchRowProps) {
  const { label, help, checked, onCheckedChange } = props;
  const labelId = React.useId();

  return (
    <SettingsRow label={label} labelId={labelId} help={help}>
      <Switch
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </SettingsRow>
  );
}
