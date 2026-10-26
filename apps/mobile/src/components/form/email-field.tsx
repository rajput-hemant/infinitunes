import { FormField } from "~/components/form/form-field";
import type { FormFieldProps } from "~/components/form/form-field";

type EmailFieldProps = Omit<
  FormFieldProps,
  "label" | "keyboardType" | "autoCapitalize" | "autoCorrect"
> & { label?: string };

/** The email address field: email keyboard, no capitalisation, autofill. */
export function EmailField({ label = "Email", ...props }: EmailFieldProps) {
  return (
    <FormField
      label={label}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      {...props}
    />
  );
}
