"use client";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
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

export function PlaylistFields({
  control,
}: {
  control: Control<PlaylistFormData>;
}) {
  return (
    <>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="vertical">
            <FieldLabel className={labelStyles}>
              Playlist Name{" "}
              <span aria-hidden className="text-destructive">
                *
              </span>
            </FieldLabel>
            <FieldContent>
              <Input
                type="text"
                required
                placeholder="Enter playlist name"
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
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field orientation="vertical">
            <FieldLabel className={labelStyles}>Description</FieldLabel>
            <FieldContent>
              <Input
                type="text"
                placeholder="Enter playlist description"
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
    </>
  );
}
