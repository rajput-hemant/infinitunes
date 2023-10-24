"use client";

import { useState } from "react";

import { type Lyrics } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { H3, Small } from "@/components/ui/topography";

type Props = { lyrics: Lyrics };

const Lyrics = ({ lyrics }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={() => setIsCollapsed(!isCollapsed)}
    >
      <AccordionItem value="lyrics">
        <AccordionTrigger className="!no-underline">
          <div className="flex flex-col items-start gap-2">
            <H3>Lyrics</H3>

            {isCollapsed && (
              <>
                <Small className="text-muted-foreground">
                  {lyrics.snippet}
                </Small>

                <Small className="italic">Read More...</Small>
              </>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <Small
            className="text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: lyrics.lyrics + "<br/><br/>" + lyrics.lyrics_copyright,
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default Lyrics;
