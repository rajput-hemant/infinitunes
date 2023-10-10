import Link from "next/link";

import { languages } from "@/config/languages";
import { sidebarNav } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { getFooterDetails } from "@/lib/jiosaavn-api";
import { Icons } from "./icons";
import { buttonVariants } from "./ui/button";
import { Separator } from "./ui/separator";
import { P, Small } from "./ui/topography";

export default async function SiteFooter() {
  const { artist, actor, album, playlist } = await getFooterDetails();

  return (
    <footer className="w-full">
      <Separator />
      <div className="mx-auto my-4 flex list-none gap-4 overflow-x-scroll px-4 md:justify-evenly">
        <div className="min-w-fit">
          <Small>Top Artist</Small>

          <ul className="mt-2 w-fit space-y-1">
            {artist.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-xs text-muted-foreground hover:text-secondary-foreground"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>Top Actors</Small>

          <ul className="my-2">
            {actor.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-xs text-muted-foreground hover:text-secondary-foreground"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>

          <Small>Browse</Small>

          <ul className="mt-2 w-fit space-y-1">
            {sidebarNav.map(({ href, title }) => (
              <li
                key={title}
                className="text-xs text-muted-foreground hover:text-secondary-foreground"
              >
                <Link href={href}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>New Releases</Small>

          <ul className="mt-2 w-fit space-y-1">
            {album.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-xs text-muted-foreground hover:text-secondary-foreground"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>Top Playlists</Small>

          {playlist.map(({ id, title, action }) => (
            <li
              key={id}
              className="text-xs text-muted-foreground hover:text-secondary-foreground"
            >
              <Link href={action}>{title}</Link>
            </li>
          ))}
        </div>

        <div className="min-w-fit">
          <Small>Language</Small>

          <ul className="mt-2 w-fit space-y-1">
            {languages.map((lang) => (
              <li
                key={lang}
                className="text-xs text-muted-foreground hover:text-secondary-foreground"
              >
                <Link
                  href={`/album?lang=${lang.toLowerCase()}`}
                >{`${lang} Songs`}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator />

      <P className="mt-2 text-center text-sm text-muted-foreground lg:px-10">
        This website is not affiliated with JioSaavn. All trademarks and
        copyrights belong to their respective owners. All media, images, and
        songs are the property of their respective owners. This website is for
        educational purposes only.
      </P>

      <div className="my-4 flex flex-col items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}.
        </span>

        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Icons.GitHub className="h-5 w-5" />
        </a>
      </div>
    </footer>
  );
}
