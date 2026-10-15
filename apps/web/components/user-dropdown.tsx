"use client";

import { useState } from "react";

import { useIsPhone } from "~/components/site-header/use-is-phone";
import {
  type UserMenuUser,
  UserMenuTriggerAvatar,
  userMenuTriggerClassName,
} from "~/components/site-header/user-menu-parts";
import { useDeferred } from "~/hooks/use-deferred";

type UserDropdownProps = {
  user?: UserMenuUser;
};

const loadPopup = () => import("./user-dropdown-popup");

/**
 * The toolbar's avatar button. The menu behind it (dropdown from 768px, bottom
 * sheet below) and the shortcuts dialog are a separate chunk: the first hover,
 * focus, pointer down or arrow key loads it and swaps this identical closed
 * trigger for the real one. A click before that opens the menu once it lands.
 */
export function UserDropdown({ user }: UserDropdownProps) {
  const isPhone = useIsPhone();
  const { mod, preload, intent } = useDeferred("user-menu", loadPopup);
  const [clicked, setClicked] = useState(false);

  if (mod) return <mod.UserDropdownPopup user={user} defaultOpen={clicked} />;

  return (
    <button
      type="button"
      aria-haspopup={isPhone ? "dialog" : "menu"}
      aria-expanded={false}
      aria-label="Open user menu"
      data-slot={isPhone ? "drawer-trigger" : "dropdown-menu-trigger"}
      data-deferred="user-menu"
      className={userMenuTriggerClassName}
      {...intent}
      onKeyDown={(event) => {
        // A menu button also opens on the arrow keys.
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          preload();
          setClicked(true);
        }
      }}
      onClick={() => {
        preload();
        setClicked(true);
      }}
    >
      <UserMenuTriggerAvatar user={user} />
    </button>
  );
}
