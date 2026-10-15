import { Headphones, Lock, Palette, UserCog2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsNavItem = {
  /** The section's element id, and the hash its rail link points at. */
  id: string;
  title: string;
  /** The small group label over the item in the side rail. */
  group: string;
  icon: LucideIcon;
};

export const settingsNavItems: readonly SettingsNavItem[] = [
  { id: "account", title: "Account", group: "Account", icon: UserCog2 },
  {
    id: "appearance",
    title: "Appearance",
    group: "Look and feel",
    icon: Palette,
  },
  { id: "playback", title: "Playback", group: "Your music", icon: Headphones },
  {
    id: "security",
    title: "Security and danger",
    group: "Privacy",
    icon: Lock,
  },
];
