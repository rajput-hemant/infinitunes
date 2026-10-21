import { forwardRef } from "react";

import { FormField } from "./form-field";
import type { FormFieldProps, TextInputHandle } from "./form-field";

type EmailFieldProps = Omit<
  FormFieldProps,
  "label" | "keyboardType" | "autoCapitalize" | "autoCorrect"
> & { label?: string };

/** The email address field: email keyboard, no capitalisation, autofill. */
export const EmailField = forwardRef<TextInputHandle, EmailFieldProps>(
  function EmailField({ label = "Email", ...props }, ref) {
    return (
      <FormField
        ref={ref}
        label={label}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        {...props}
      />
    );
  },
);
