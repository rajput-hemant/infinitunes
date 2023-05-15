import { CiSearch } from "react-icons/ci";
import { TbMoonStars, TbSun } from "react-icons/tb";
import { NavLink } from "react-router-dom";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks";
import { Input } from "./ui/input";
import { TopographySmall } from "./ui/topography";

const Navbar = () => {
  const { toggleTheme } = useTheme();

  return (
    <header className="border-border bg-background/60 sticky inset-0 z-50 h-16 border-b px-4 backdrop-blur-md md:px-6 lg:px-10 xl:px-14">
      <nav className="flex h-full w-full items-center gap-3">
        <div className="relative aspect-square rounded-full md:-ml-6 lg:ml-0">
          <img
            src="/images/logo192.png"
            alt="Infinitunes Logo"
            className="w-16 object-cover transition-transform duration-300 hover:scale-125 lg:w-20"
          />

          {/* for ping animation on logo bg */}
          {/* <div className="bg-primary absolute inset-3 -z-10 animate-ping rounded-full" /> */}
        </div>

        {/* left container */}
        <div className="hidden h-full flex-1 items-center md:flex">
          {siteConfig.nav.map(({ name, path }) => (
            <NavLink
              key={name}
              to={path}
              className={({ isActive }) =>
                cn(
                  "text-label flex h-full items-center border-b-2 border-transparent px-2 hover:text-black",
                  isActive && "border-b-label text-black"
                )
              }
            >
              <TopographySmall inter className="font-bold">
                {name}
              </TopographySmall>
            </NavLink>
          ))}
        </div>

        {/* center container */}
        <div className="hidden flex-1 justify-end md:flex lg:justify-center">
          <Input
            icon={CiSearch}
            placeholder="Search"
            className="mx-auto w-72 rounded-full focus-within:w-80 lg:w-80 lg:focus-within:w-96"
          />
        </div>

        {/* right container */}
        <div className="text-label2 ml-auto flex justify-end lg:flex-1">
          <button onClick={toggleTheme} className="my-auto">
            <TbMoonStars className="h-6 w-6 dark:hidden" />

            <TbSun className="hidden h-6 w-6 active:animate-spin dark:flex" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
