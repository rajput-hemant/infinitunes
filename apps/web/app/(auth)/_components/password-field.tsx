"use client";

import {
  Field,
  FieldDescription,
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

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { authInputStyles, authLabelStyles } from "./field-styles";

type PasswordFieldProps = {
  field: Pick<
    React.ComponentProps<"input">,
    "name" | "value" | "onChange" | "onBlur" | "ref"
  >;
  fieldState: ControllerFieldState;
  label: string;
  /** Sits at the end of the label row, e.g. the login "Forgot password?" link. */
  labelAction?: React.ReactNode;
  description?: string;
  autoComplete: string;
  disabled: boolean;
};

export function PasswordField(props: PasswordFieldProps) {
  const {
    field,
    fieldState,
    label,
    labelAction,
    description,
    autoComplete,
    disabled,
  } = props;

  const id = React.useId();
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleLabel = isVisible ? "Hide password" : "Show password";

  return (
    <Field data-invalid={!!fieldState.error}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id} className={authLabelStyles}>
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
          placeholder="••••••••••"
          className={cn(authInputStyles, "pr-10")}
          {...field}
        />
        <Tooltip>
          <TooltipTrigger
            delay={150}
            aria-label={toggleLabel}
            type="button"
            disabled={!field.value}
            onClick={() => setIsVisible(!isVisible)}
            className={cn(
              controlStyles.headerIcon,
              "absolute inset-y-0 right-0 flex items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {isVisible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </TooltipTrigger>

          <TooltipContent>
            <p className="text-xs">{toggleLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      {description && (
        <FieldDescription className="text-xs">{description}</FieldDescription>
      )}
      <FieldError errors={[fieldState.error]} />
    </Field>
  );
}
