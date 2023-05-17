import { CiSearch } from "react-icons/ci";
import { IoMdSettings } from "react-icons/io";
import { TbMoonStars, TbSun } from "react-icons/tb";
import { NavLink, useNavigate } from "react-router-dom";

import { setSearch } from "@/store/search-slice";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector, useTheme } from "@/hooks";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { TopographySmall } from "./ui/topography";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toggleTheme } = useTheme();
  const {
    search: { query },
    root: {
      player: { isPlaying },
    },
  } = useAppSelector((state) => state);

  return (
    <header className="border-border bg-background/90 sticky inset-0 z-50 h-16 border-b px-4 backdrop-blur-md md:px-6 lg:px-10 xl:px-14">
      <nav className="flex h-full w-full gap-3">
        {/* left container */}
        <div className="flex w-1/3">
          <div className="relative">
            <img
              src="/images/logo192.png"
              alt="Infinitunes Logo"
              className="-mt-2 w-16 object-cover transition-transform duration-300 hover:scale-125 lg:w-20"
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
          <Input
            icon={CiSearch}
            placeholder="Search"
            onClick={() => navigate("/search")}
            value={query}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="mx-auto w-72 rounded-full transition-all duration-500 focus-within:w-80 lg:w-80 lg:focus-within:w-96"
          />
        </div>

        {/* right container */}
        <div className="text-label2 ml-auto flex w-1/3 items-center justify-end">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            size="sm"
            className="border-none"
          >
            <TbMoonStars className="h-6 w-6 dark:hidden" />

            <TbSun className="hidden h-6 w-6 active:animate-spin dark:flex" />
          </Button>

          <Button variant="ghost" size="sm" className="border-none">
            <IoMdSettings className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
