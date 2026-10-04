import type { Lang } from "@infinitunes/types";

import { LanguageBar } from "~/components/language-bar";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

import { FeaturedStations } from "./_components/featured-stations";

const title = "Top Indian Radio Stations";
const description =
  "Listen to the top Indian radio stations online. Stream live music, news, sports, and talk radio from India.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/radio",
  image: "https://graph.org/file/857b2fc40944dbb65b184.png",
  alt: "Top Indian Radio Stations",
});

type Props = {
  searchParams: Promise<{
    page?: number;
    lang?: Lang;
  }>;
};

export default async function RadioPage(props: Props) {
  const { page = 1, lang } = await props.searchParams;

  const radioStations = await api.get.featuredStations({
    page,
    n: 50,
    lang,
  });

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        Radio Stations
      </h1>

      <FeaturedStations
        key={radioStations[0]?.id ?? "stations"}
        initialStations={radioStations}
        lang={lang}
      />
    </div>
  );
}
