"use client";

import { Switch } from "@infinitunes/ui/components/switch";
import React from "react";

import { cn } from "~/lib/utils";

import { useSettingsMatch } from "./settings-search";

type SettingsRowProps = {
  id?: string;
  label: string;
  labelId?: string;
  help?: React.ReactNode;
  /** Extra words the settings search matches besides the label and help. */
  keywords?: string;
  /** `stack` puts the control under the label, for wide controls (tiles, chips). */
  layout?: "inline" | "stack";
  children: React.ReactNode;
  className?: string;
};

/** One setting: a label and help on the left, its control on the right (under the label on phones). */
export function SettingsRow(props: SettingsRowProps) {
  const {
    id,
    label,
    labelId,
    help,
    keywords = "",
    layout = "inline",
    children,
    className,
  } = props;
  const text = `${label} ${typeof help === "string" ? help : ""} ${keywords}`;
  const visible = useSettingsMatch(text);

  return (
    <div
      id={id}
      hidden={!visible}
      data-settings-row=""
      className={cn(
        "scroll-mt-36 gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 last:border-b-0 lg:scroll-mt-20",
        layout === "stack"
          ? "grid"
          : "flex flex-wrap items-center justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1 basis-48 space-y-0.5">
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

type SettingsBlockProps = {
  /** What the settings search matches this block against. */
  keywords: string;
  children: React.ReactNode;
  className?: string;
};

/** A row-shaped slot for content that is not label plus control (a form). */
export function SettingsBlock(props: SettingsBlockProps) {
  const { keywords, children, className } = props;
  const visible = useSettingsMatch(keywords);

  return (
    <div
      hidden={!visible}
      data-settings-row=""
      className={cn(
        "border-b border-line px-4 py-4 last:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

type SwitchRowProps = {
  label: string;
  help?: React.ReactNode;
  keywords?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchRow(props: SwitchRowProps) {
  const { label, help, keywords, checked, onCheckedChange } = props;
  const labelId = React.useId();

  return (
    <SettingsRow
      label={label}
      labelId={labelId}
      help={help}
      keywords={keywords}
    >
      <Switch
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </SettingsRow>
  );
}
