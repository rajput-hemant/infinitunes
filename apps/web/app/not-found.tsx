import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { asRoute } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Error 404",
  description: "Page not found!, but there are plenty of other great tunes!",
};

const LINKS: { title: string; href: Route }[] = [
  {
    title: "Weekly Top Songs",
    href: asRoute("/playlist/weekly-top-songs/8MT-LQlP35c_"),
  },
  {
    title: "Featured Playlists",
    href: "/playlist",
  },
  {
    title: "New Releases",
    href: "/album",
  },
  {
    title: "Radio Stations",
    href: "/radio",
  },
];

const NotFound = () => {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-y-4 px-4 py-8 text-center">
      <Image
        src="/images/404.png"
        height={300}
        width={600}
        alt="404 not found"
        className="h-auto w-full max-w-xl drop-shadow-sm"
      />

      <h1 className="font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        This page seems to be{" "}
        <span className="text-destructive underline underline-offset-4 selection:text-destructive">
          missing
        </span>
        .
      </h1>

      <h2 className="text-lg font-medium italic">
        But, there are plenty of other great tunes!
      </h2>

      <p className="text-lg font-normal italic">Try one of these:</p>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-heading text-sm font-medium italic drop-shadow-sm sm:text-lg lg:text-2xl">
        {LINKS.map(({ title, href }, i, arr) => (
          <React.Fragment key={i}>
            <Link
              key={title}
              href={href}
              className="inline-block py-1 underline-offset-4 hover:underline"
            >
              <span>{title}</span>
            </Link>

            {i !== arr.length - 1 && (
              <span aria-hidden className="text-muted-foreground">
                /
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default NotFound;
