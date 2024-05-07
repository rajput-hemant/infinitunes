import React from "react";
import Image from "next/image";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error 404",
  description: "Page not found!, but there are plenty of other great tunes!",
};

const LINKS = [
  {
    title: "Weekly Top Songs",
    href: "/playlist/weekly-top-songs/8MT-LQlP35c_",
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
    <section className="flex h-screen flex-col items-center justify-center gap-y-4">
      <Image
        src="/images/404.png"
        height={300}
        width={600}
        alt="404 not found"
        className="drop-shadow"
      />

      <h1 className="font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        This page seems to be{" "}
        <span className="text-red-500 underline underline-offset-4 selection:text-red-500">
          missing
        </span>
        .
      </h1>

      <h2 className="text-lg font-medium italic">
        But, there are plenty of other great tunes!
      </h2>

      <p className="text-lg font-normal italic">Try one of these:</p>

      <div className="flex flex-wrap justify-center space-x-4 font-heading text-sm font-medium italic drop-shadow sm:text-lg md:text-left lg:text-2xl">
        {LINKS.map(({ title, href }, i, arr) => (
          <React.Fragment key={i}>
            <Link
              key={title}
              href={href}
              className="underline-offset-4 hover:underline"
            >
              <span>{title}</span>
            </Link>

            {i !== arr.length - 1 && (
              <span className="ml-4 text-muted-foreground">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default NotFound;
