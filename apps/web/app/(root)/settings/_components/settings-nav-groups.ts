import {
  Download,
  Fingerprint,
  Headphones,
  ImageDown,
  KeyRound,
  Keyboard,
  Languages,
  Layers,
  Palette,
  Radius,
  Rows3,
  SunMoon,
  Trash2,
  Type,
  UserCog2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export type SettingsNavGroup = {
  title: string;
  href: Route;
  items: readonly { hash: string; title: string; icon: LucideIcon }[];
};

export const settingsNavGroups: readonly SettingsNavGroup[] = [
  {
    title: "Account",
    href: "/settings",
    items: [
      { hash: "profile", title: "Edit Profile", icon: UserCog2 },
      { hash: "password", title: "Change Password", icon: KeyRound },
      { hash: "passkeys", title: "Passkeys", icon: Fingerprint },
      { hash: "delete", title: "Delete Account", icon: Trash2 },
    ],
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    items: [
      { hash: "mode", title: "Mode", icon: SunMoon },
      { hash: "accent", title: "Accent color", icon: Palette },
      { hash: "radius", title: "Radius", icon: Radius },
      { hash: "type", title: "Typography", icon: Type },
      { hash: "density", title: "Density", icon: Rows3 },
      { hash: "material", title: "Glass and motion", icon: Layers },
    ],
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    items: [
      { hash: "language", title: "Language", icon: Languages },
      { hash: "stream-quality", title: "Stream Quality", icon: Headphones },
      { hash: "download-quality", title: "Download Quality", icon: Download },
      { hash: "image-quality", title: "Image Quality", icon: ImageDown },
      { hash: "keyboard-shortcuts", title: "Keyboard", icon: Keyboard },
    ],
  },
];
