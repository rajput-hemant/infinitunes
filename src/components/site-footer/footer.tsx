import Link from "next/link";

import { languages } from "@/config/languages";
import { siteConfig } from "@/config/site";
import { getFooterDetails } from "@/lib/jiosaavn-api";
import { Icons } from "../icons";
import { ThemeToggleGroup } from "./theme-toggle-group";

export async function SiteFooter() {
  const { artist, actor, album, playlist } = await getFooterDetails();

  const footerLinks = [
    { title: "Top Artist", data: artist },
    { title: "Top Actors", data: actor },
    { title: "New Releases", data: album },
    { title: "Top Playlists", data: playlist },
  ];

  return (
    <footer className="border-t py-6 md:py-10">
      <div className="mx-auto w-full max-w-none px-5 text-sm sm:max-w-[90%] sm:px-0 2xl:max-w-7xl">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] items-stretch justify-between gap-y-10 sm:gap-x-6 md:flex md:flex-wrap">
          <div className="col-span-full flex justify-between md:flex-col md:justify-normal">
            <Link href="/" className="flex items-start">
              <Icons.Logo className="mr-1 h-5" />
              <span className="font-heading tracking-wide drop-shadow-md">
                {siteConfig.name}
              </span>
            </Link>

            <div className="flex justify-center gap-4 text-muted-foreground md:mt-4">
              <a
                aria-label="GitHub Repository"
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="duration-200 hover:text-foreground"
              >
                <Icons.GitHub className="size-4" />
              </a>
              <a
                aria-label="X/Twitter Handle"
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="duration-200 hover:text-foreground"
              >
                <Icons.X className="size-4" />
              </a>
              <a
                aria-label="Discord Server"
                href={siteConfig.links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="duration-200 hover:text-foreground"
              >
                <Icons.Discord className="size-[18px]" />
              </a>
            </div>
          </div>

          {footerLinks.map(({ title, data }) => (
            <div key={title} className="flex flex-col gap-2.5">
              <p className="text-sm font-semibold lg:text-sm">{title}</p>

              <ul className="w-fit space-y-1">
                {data.map(({ id, title, action }) => (
                  <li
                    key={id}
                    className="w-full text-xs text-muted-foreground hover:text-secondary-foreground"
                  >
                    <Link href={action.replace("featured", "playlist")}>
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold lg:text-sm">Languages</p>

            <ul className="w-fit space-y-1">
              {languages.map((lang) => (
                <li
                  key={lang}
                  className="w-full text-xs text-muted-foreground hover:text-secondary-foreground"
                >
                  <Link
                    href={`/album?lang=${lang.toLowerCase()}`}
                  >{`${lang} Songs`}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-7xl flex-col items-center justify-between gap-4 border-t py-6 lg:flex-row">
        <p className="max-w-4xl text-center text-xs text-muted-foreground lg:text-sm">
          <Link href="/" className="inline-flex items-center justify-center">
            <span className="font-heading text-base tracking-wide text-primary underline drop-shadow-md">
              {siteConfig.name}
            </span>
          </Link>{" "}
          is not affiliated with JioSaavn. All trademarks and copyrights belong
          to their respective owners. All media, images, and songs are the
          property of their respective owners. This site is for educational
          purposes only.
        </p>

        <ThemeToggleGroup className="w-fit" />
      </div>
    </footer>
  );
}
