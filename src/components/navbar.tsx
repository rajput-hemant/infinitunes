import { TbMoonStars, TbSun } from "react-icons/tb";
import { Link } from "react-router-dom";

import { siteConfig } from "@/config/site";
import { useTheme } from "@/hooks";
import { TopographySmall } from "./topography";

const Navbar = () => {
  const { toggleTheme } = useTheme();

  return (
    <header className="border-accent-foreground sticky inset-0 z-50 h-16 border-b bg-black/25 backdrop-blur-md xl:px-10">
      <nav className="flex h-full w-full items-center">
        {/* <div className="relative aspect-square rounded-full"> */}
        <img
          src="/images/logo192.png"
          alt="Infinitunes Logo"
          className="w-24 object-cover p-1"
        />

        {/* for ping animation on logo bg */}
        {/* <div className="bg-accent-foreground absolute inset-3 -z-10 animate-ping rounded-full dark:bg-slate-600" />
        </div> */}

        {siteConfig.nav.map(({ name, path }) => (
          <Link
            key={name}
            to={path}
            className="hover:text-accent-foreground px-2 text-black hover:scale-110"
          >
            <TopographySmall inter className="font-bold">
              {name}
            </TopographySmall>
          </Link>
        ))}

        <button onClick={toggleTheme} className="my-auto ml-auto">
          <TbMoonStars className="h-6 w-6 dark:hidden" />

          <TbSun className="hidden h-6 w-6 active:animate-spin dark:flex" />
        </button>
      </nav>

      <style></style>
    </header>
  );
};

export default Navbar;
