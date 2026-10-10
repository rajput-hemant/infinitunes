"use client";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import React from "react";
import type { ControllerFieldState } from "react-hook-form";

import { authInputStyles, authLabelStyles } from "./field-styles";

type EmailFieldProps = {
  field: Pick<
    React.ComponentProps<"input">,
    "name" | "value" | "onChange" | "onBlur" | "ref"
  >;
  fieldState: ControllerFieldState;
  autoComplete: string;
  disabled: boolean;
};

export function EmailField(props: EmailFieldProps) {
  const { field, fieldState, autoComplete, disabled } = props;

  const id = React.useId();

  return (
    <Field data-invalid={!!fieldState.error}>
      <FieldLabel htmlFor={id} className={authLabelStyles}>
        Email
      </FieldLabel>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        aria-invalid={!!fieldState.error}
        placeholder="name@example.com"
        className={authInputStyles}
        {...field}
      />
      <FieldError errors={[fieldState.error]} />
    </Field>
  );
}
