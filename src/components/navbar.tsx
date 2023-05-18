import SearchInput from "@/pages/search/search-input";
import { IoMdSettings } from "react-icons/io";
import { TbMoonStars, TbSun } from "react-icons/tb";
import { NavLink } from "react-router-dom";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAppSelector, useTheme } from "@/hooks";
import { Button } from "./ui/button";
import { TopographySmall } from "./ui/topography";

const Navbar = () => {
  const { toggleTheme } = useTheme();
  const { isPlaying } = useAppSelector((state) => state.root.player);

  return (
    <header className="border-border bg-background/90 sticky inset-0 z-50 h-16 border-b backdrop-blur-md md:px-6 lg:px-10 xl:px-14">
      <nav className="flex h-full w-full gap-3">
        {/* left container */}
        <div className="flex w-1/3">
          <div className="relative">
            <img
              src="/images/logo192.png"
              alt="Infinitunes Logo"
              className="w-16 object-cover transition-transform duration-300 hover:scale-125 md:-mt-2 lg:w-20"
            />

            {/* for ping animation on logo bg */}
            {isPlaying && (
              <div className="bg-primary absolute inset-2 -z-10 animate-ping rounded-full" />
            )}
          </div>

          <div className="hidden h-full items-center lg:flex">
            {siteConfig.nav.map(({ name, path }) => (
              <NavLink
                key={name}
                to={path}
                className={({ isActive }) =>
                  cn(
                    "flex h-full items-center border-b-2 border-transparent px-2 hover:text-black dark:hover:text-white",
                    isActive && "border-b-label text-black dark:text-white"
                  )
                }
              >
                <TopographySmall inter className="font-bold">
                  {name}
                </TopographySmall>
              </NavLink>
            ))}
          </div>
        </div>

        {/* center container */}
        <div className="hidden w-1/3 justify-center lg:flex">
          <SearchInput />
        </div>

        {/* right container */}
        <div className="text-label2 ml-auto flex w-1/3 items-center justify-end">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            size="sm"
            className="border-none px-2"
          >
            <TbMoonStars className="h-6 w-6 dark:hidden" />

            <TbSun className="hidden h-6 w-6 active:animate-spin dark:flex" />
          </Button>

          <Button variant="ghost" size="sm" className="border-none px-2">
            <IoMdSettings className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
