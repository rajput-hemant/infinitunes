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
import { SideNavItems } from "./side-navbar-items";

export type SidebarNavItem = {
  section: string;
  href: string;
  items: {
    hash: string;
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
        hash: "edit-profile",
        icon: <UserCog2 className={iconClass} />,
      },
      {
        title: "Change Password",
        hash: "change-password",
        icon: <Key className={iconClass} />,
      },
      {
        title: "Delete Account",
        hash: "delete-account",
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
        hash: "mode",
        icon: <SunMoon className={iconClass} />,
      },
      {
        title: "Themes",
        hash: "theme",
        icon: <Palette className={iconClass} />,
      },
      {
        title: "Radius",
        hash: "radius",
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
        hash: "language",
        icon: <Languages className={iconClass} />,
      },
      {
        title: "Stream Quality",
        hash: "stream-quality",
        icon: <Headphones className={iconClass} />,
      },
      {
        title: "Download Quality",
        hash: "download-quality",
        icon: <DownloadCloud className={iconClass} />,
      },
      {
        title: "Image Quality",
        hash: "image-quality",
        icon: <ImageDown className={iconClass} />,
      },
    ],
  },
];

export function SideNavbar() {
  return (
    <nav className="flex flex-col gap-2">
      {sidebarNavItems.map(({ section, href, items }, i) => (
        <React.Fragment key={`${section}-${i}`}>
          <div key={i} className="hidden flex-col gap-2 lg:flex">
            <h3 className="font-semibold drop-shadow-sm dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-lg md:text-xl">
              {section}
            </h3>

            <SideNavItems
              items={items}
              href={href}
              className="flex flex-col gap-0.5"
            />
          </div>

          <Accordion key={section} type="multiple" className="lg:hidden">
            <AccordionItem value={section.toLowerCase()}>
              <AccordionTrigger>
                <h3 className="font-semibold drop-shadow-sm dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-lg md:text-xl">
                  {section}
                </h3>
              </AccordionTrigger>

              <AccordionContent>
                <SideNavItems
                  items={items}
                  href={href}
                  className="flow-row flex flex-wrap gap-2"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </React.Fragment>
      ))}
    </nav>
  );
}
