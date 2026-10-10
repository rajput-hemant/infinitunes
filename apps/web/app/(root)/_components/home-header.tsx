import { Button } from "@infinitunes/ui/components/button";
import { Suspense } from "react";

import { SurpriseMeButton } from "~/components/site-header/surprise-me-button";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { HomeGreeting } from "./home-greeting";
import { HomeLanguageChips } from "./home-language-chips";

const surpriseClassName = cn(controlStyles.text, "shrink-0");

/** Greeting, Surprise me and the language chips above the hero (mockup `.phead` + `.chips`). */
export function HomeHeader() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <HomeGreeting />
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Fresh picks for you.
          </p>
        </div>

        {/* SurpriseMeButton reads the URL, so it renders on the client only. */}
        <Suspense
          fallback={
            <Button variant="secondary" disabled className={surpriseClassName}>
              Surprise Me
            </Button>
          }
        >
          <SurpriseMeButton variant="secondary" className={surpriseClassName} />
        </Suspense>
      </div>

      <HomeLanguageChips />
    </div>
  );
}
