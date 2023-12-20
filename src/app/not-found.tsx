import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { H1, H3, Large } from "@/components/ui/topography";

export const metadata: Metadata = {
  title: "Error 404",
};

const Links = [
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
      />
      <H1>
        This page seems to be{" "}
        <span className="text-red-500 selection:text-red-500">missing</span>.
      </H1>

      <H3 className="font-medium italic">
        But, there are plenty of other great tunes!
      </H3>

      <Large className="font-normal italic">Try one of these:</Large>

      <div className="flex flex-wrap justify-center space-x-4 font-mono text-sm font-medium italic lg:text-xl">
        {Links.map(({ title, href }, i) => (
          <React.Fragment key={i}>
            <Link
              key={title}
              href={href}
              className="underline-offset-4 hover:underline"
            >
              <span>{title}</span>
            </Link>

            {i !== Links.length - 1 && (
              <span className="text-muted-foreground ml-4">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default NotFound;
