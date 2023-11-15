import React from "react";
import {
  DownloadCloud,
  Headphones,
  ImageDown,
  Key,
  Languages,
  Palette,
  Radius,
  SunMoon,
  UserCog2,
  UserX2,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SettingsSidebarNavItems } from "./settings-sidebar-nav-items";

export type SidebarNavItem = {
  section: string;
  href: string;
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
};

const iconClass = "mr-2 h-5 w-5";
const sidebarNavItems: SidebarNavItem[] = [
  {
    section: "Account",
    href: "/settings",
    items: [
      {
        title: "Edit Profile",
        href: "edit-profile",
        icon: <UserCog2 className={iconClass} />,
      },
      {
        title: "Change Password",
        href: "change-password",
        icon: <Key className={iconClass} />,
      },
      {
        title: "Delete Account",
        href: "delete-account",
        icon: <UserX2 className={iconClass} />,
      },
    ],
  },
  {
    section: "Appearance",
    href: "/settings/appearance",
    items: [
      {
        title: "Mode",
        href: "mode",
        icon: <SunMoon className={iconClass} />,
      },
      {
        title: "Themes",
        href: "theme",
        icon: <Palette className={iconClass} />,
      },
      {
        title: "Radius",
        href: "radius",
        icon: <Radius className={iconClass} />,
      },
    ],
  },
  {
    section: "Preferences",
    href: "/settings/preferences",
    items: [
      {
        title: "Language",
        href: "language",
        icon: <Languages className={iconClass} />,
      },
      {
        title: "Stream Quality",
        href: "stream-quality",
        icon: <Headphones className={iconClass} />,
      },
      {
        title: "Download Quality",
        href: "download-quality",
        icon: <DownloadCloud className={iconClass} />,
      },
      {
        title: "Image Quality",
        href: "image-quality",
        icon: <ImageDown className={iconClass} />,
      },
    ],
  },
];

export function SettingsSidebarNav() {
  return (
    <nav className="flex flex-col">
      {sidebarNavItems.map(({ section, href, items }, i) => (
        <>
          {/* for large devices */}
          <div key={i} className="hidden flex-col lg:flex">
            <h3 className="my-2 ml-4 font-semibold tracking-wide">{section}</h3>

            <SettingsSidebarNavItems
              items={items}
              href={href}
              className="flex flex-col"
            />
          </div>

          {/* for small devices */}
          <Accordion key={section} type="multiple" className="lg:hidden">
            <AccordionItem value={section.toLowerCase()}>
              <AccordionTrigger>
                <h3 className="text-sm font-semibold tracking-wide">
                  {section}
                </h3>
              </AccordionTrigger>

              <AccordionContent>
                <SettingsSidebarNavItems
                  items={items}
                  href={href}
                  className="flow-row flex flex-wrap gap-2"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      ))}
    </nav>
  );
}
