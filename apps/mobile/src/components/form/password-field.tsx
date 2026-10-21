import { forwardRef, useState } from "react";

import { FormField } from "~/components/form/form-field";
import type {
  FormFieldProps,
  TextInputHandle,
} from "~/components/form/form-field";
import { IconButton } from "~/components/ui/icon-button";

/** `passwordSchema` for iOS's strong-password suggestion. */
const PASSWORD_RULES =
  "minlength: 8; required: lower; required: upper; required: digit; required: [-().&@?'#,/\"+_~!$%^*=<>:;[]{}|\\];";

type PasswordFieldProps = Omit<
  FormFieldProps,
  | "secureTextEntry"
  | "autoComplete"
  | "textContentType"
  | "autoCapitalize"
  | "autoCorrect"
  | "trailing"
> & {
  /** The saved password to fill in, or a new one to choose and save. */
  purpose: "current" | "new";
};

/** A password field with a show/hide toggle and the platform's autofill hints. */
export const PasswordField = forwardRef<TextInputHandle, PasswordFieldProps>(
  function PasswordField({ purpose, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const choosing = purpose === "new";

    return (
      <FormField
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={choosing ? "new-password" : "current-password"}
        textContentType={choosing ? "newPassword" : "password"}
        passwordRules={choosing ? PASSWORD_RULES : undefined}
        trailing={
          <IconButton
            icon={
              visible
                ? { ios: "eye.slash", android: "visibility_off" }
                : { ios: "eye", android: "visibility" }
            }
            label={visible ? "Hide password" : "Show password"}
            size="md"
            onPress={() => setVisible((shown) => !shown)}
          />
        }
        {...props}
      />
    );
  },
);
