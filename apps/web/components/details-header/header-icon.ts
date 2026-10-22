import { buttonVariants } from "@infinitunes/ui/components/button";

import { controlStyles } from "~/lib/control-styles";

/** The header's icon buttons, shared by the closed shell triggers and the real popups so the swap changes nothing. */
export const headerIconClassName = buttonVariants({
  size: "icon",
  variant: "ghost",
  className: controlStyles.headerIcon,
});
