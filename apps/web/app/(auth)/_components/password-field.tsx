"use client";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@infinitunes/ui/components/field";
import { Input } from "@infinitunes/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { Eye, EyeOff } from "lucide-react";
import React from "react";
import type { ControllerFieldState } from "react-hook-form";

type PasswordFieldProps = {
  field: Pick<
    React.ComponentProps<"input">,
    "name" | "value" | "onChange" | "onBlur" | "ref"
  >;
  fieldState: ControllerFieldState;
  label: string;
  autoComplete: string;
  disabled: boolean;
};

export function PasswordField(props: PasswordFieldProps) {
  const { field, fieldState, label, autoComplete, disabled } = props;

  const id = React.useId();
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleLabel = isVisible ? "Hide password" : "Show password";

  return (
    <Field data-invalid={!!fieldState.error}>
      <FieldLabel htmlFor={id} className="sr-only">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
          placeholder="••••••••••"
          className="h-10 pr-11 shadow-xs"
          {...field}
        />
        <Tooltip>
          <TooltipTrigger
            delay={150}
            aria-label={toggleLabel}
            type="button"
            disabled={!field.value}
            onClick={() => setIsVisible(!isVisible)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isVisible ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </TooltipTrigger>

          <TooltipContent>
            <p className="text-xs">{toggleLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <FieldError errors={[fieldState.error]} />
    </Field>
  );
}
