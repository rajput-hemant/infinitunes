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

      <div className="mx-auto my-4 flex list-none gap-4 overflow-x-scroll md:justify-between md:px-5 xl:px-10">
        <div className="min-w-fit">
          <Small>Top Artist</Small>

          <ul className="mt-2 w-fit space-y-1">
            {artist.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>Top Actors</Small>

          <ul className="my-2 w-fit space-y-1">
            {actor.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
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
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
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
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>Top Playlists</Small>

          <ul className="mt-2 w-fit space-y-1">
            {playlist.map(({ id, title, action }) => (
              <li
                key={id}
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
              >
                <Link href={action}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-fit">
          <Small>Language</Small>

          <ul className="mt-2 w-fit space-y-1">
            {languages.map((lang) => (
              <li
                key={lang}
                className="text-muted-foreground hover:text-secondary-foreground text-xs"
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

      <div className="my-4 flex flex-col items-center justify-center gap-1 lg:ml-[-15%]">
        <P className="text-muted-foreground mx-auto mt-2 max-w-xl text-center text-sm">
          <span className="text-primary text-base font-semibold">
            infinitunes
          </span>{" "}
          is not affiliated with JioSaavn. All trademarks and copyrights belong
          to their respective owners. All media, images, and songs are the
          property of their respective owners. This site is for educational
          purposes only.
        </P>

        <span className="text-muted-foreground text-sm">
          Made with ❤️ using{" "}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Next.js 13
          </a>{" "}
          &{" "}
          <a
            href="https://ui.shadcn.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            shadcn/ui
          </a>
        </span>

        <span className="text-muted-foreground text-sm">
          Released under the MIT License.
        </span>

        <span className="text-muted-foreground text-sm">
          Copyright &copy; {new Date().getFullYear()} {siteConfig.name}.
        </span>

        <div className="flex">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Icons.GitHub className="h-5 w-5" />
          </a>

          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Icons.Twitter className="h-5 w-5" />
          </a>

          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Icons.Discord className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
