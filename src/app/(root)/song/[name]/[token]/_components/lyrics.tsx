"use client";

import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { type Lyrics } from "@/types";

type LyricsProps = { lyrics: Lyrics };

export function Lyrics({ lyrics }: LyricsProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={() => setIsCollapsed(!isCollapsed)}
    >
      <AccordionItem value="lyrics">
        <AccordionTrigger className="!no-underline">
          <div className="flex flex-col items-start gap-2">
            <h2 className="pl-2 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:pl-0">
              Lyrics
            </h2>

            {isCollapsed && (
              <>
                <p className="text-sm text-muted-foreground">
                  {lyrics.snippet}
                </p>

                <p className="text-sm italic">Read More...</p>
              </>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <p
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: lyrics.lyrics + "<br/><br/>" + lyrics.lyrics_copyright,
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
