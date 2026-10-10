import Link from "next/link";

import { languages } from "~/config/languages";
import { siteConfig } from "~/config/site";
import { controlStyles } from "~/lib/control-styles";
import { footerOrEmpty } from "~/lib/shell-data";
import { api } from "~/lib/trpc/server";
import { asRoute, cn } from "~/lib/utils";

import { Icons } from "../icons";
import { ThemeToggleGroup } from "./theme-toggle-group";

const linkClassName =
  "flex items-center py-1.5 transition-colors duration-fast hover:text-foreground pointer-coarse:min-h-11";

const socialLinkClassName = cn(
  controlStyles.headerIcon,
  "flex items-center justify-center transition-colors duration-fast hover:bg-fill hover:text-foreground",
);

export async function SiteFooter() {
  const { artist, actor, album, playlist } = await footerOrEmpty(
    api.get.footer({ lang: "hindi" }),
  );

  const footerLinks = [
    { title: "Top Artist", data: artist },
    { title: "Top Actors", data: actor },
    { title: "New Releases", data: album },
    { title: "Top Playlists", data: playlist },
  ];

  return (
    <footer className="mt-16 border-t pt-6 text-xs/4 text-muted-foreground">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {footerLinks.map(({ title, data }) => (
          <section key={title}>
            <h2 className="mb-1 text-sm font-semibold text-foreground">
              {title}
            </h2>

            <ul>
              {data.map(({ id, title: linkTitle, action }) => (
                <li key={id}>
                  <Link
                    href={asRoute(action.replace("featured", "playlist"))}
                    className={linkClassName}
                  >
                    {linkTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="mb-1 text-sm font-semibold text-foreground">
            Languages
          </h2>

          <ul>
            {languages.map((lang) => (
              <li key={lang}>
                <Link
                  href={asRoute(`/album?lang=${lang.toLowerCase()}`)}
                  className={linkClassName}
                >{`${lang} Songs`}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground lowercase"
            >
              <Icons.Logo className="size-4" />
              {siteConfig.name}
            </Link>

            <a
              aria-label="GitHub Repository"
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClassName}
            >
              <Icons.GitHub className="size-4" />
            </a>
            <a
              aria-label="X/Twitter Handle"
              href={siteConfig.links.x}
              target="_blank"
              rel="noopener noreferrer"
              className={socialLinkClassName}
            >
              <Icons.X className="size-4" />
            </a>
          </div>

          <p>
            {siteConfig.name} is not affiliated with JioSaavn. All trademarks
            and copyrights belong to their respective owners. All media, images,
            and songs are the property of their respective owners. This site is
            for educational purposes only.
          </p>
        </div>

        <ThemeToggleGroup />
      </div>
    </footer>
  );
}
