"use client";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import type { ReactNode } from "react";
import { Controller, type Control } from "react-hook-form";
import type { z } from "zod";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";
import type { newPlaylistSchema } from "~/lib/validations";

type PlaylistFormData = z.infer<typeof newPlaylistSchema>;

const inputStyles = cn(
  controlStyles.textLg,
  "border-0 bg-fill px-3 hover:bg-fill-2 dark:bg-fill dark:hover:bg-fill-2",
);

const labelStyles = "text-sm font-semibold";

type PlaylistFieldProps = {
  control: Control<PlaylistFormData>;
  name: keyof PlaylistFormData;
  label: ReactNode;
  placeholder: string;
  required?: boolean;
};

function PlaylistField({
  control,
  name,
  label,
  placeholder,
  required,
}: PlaylistFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="vertical">
          <FieldLabel className={labelStyles}>{label}</FieldLabel>
          <FieldContent>
            <Input
              type="text"
              required={required}
              placeholder={placeholder}
              className={inputStyles}
              {...field}
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </FieldContent>
        </Field>
      )}
    />
  );
}

type PlaylistFieldsProps = {
  control: Control<PlaylistFormData>;
};

export function PlaylistFields({ control }: PlaylistFieldsProps) {
  return (
    <>
      <PlaylistField
        control={control}
        name="name"
        label={
          <>
            Playlist Name{" "}
            <span aria-hidden className="text-destructive">
              *
            </span>
          </>
        }
        placeholder="Enter playlist name"
        required
      />
      <PlaylistField
        control={control}
        name="description"
        label="Description"
        placeholder="Enter playlist description"
      />
    </>
  );
}
