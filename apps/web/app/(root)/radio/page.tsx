import type { Lang } from "@infinitunes/types";

import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
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
  alt: "Top Indian Radio Stations",
});

type RadioPageProps = {
  searchParams: Promise<{
    page?: number;
    lang?: Lang;
  }>;
};

export default async function RadioPage(props: RadioPageProps) {
  const { page = 1, lang } = await props.searchParams;

  const radioStations = await api.get.featuredStations({
    page,
    n: 50,
    lang,
  });

  return (
    <div>
      <LanguageBar language={lang} />

      <CatalogHeader title="Radio Stations" />

      <FeaturedStations
        key={radioStations[0]?.id ?? "stations"}
        initialStations={radioStations}
        lang={lang}
      />
    </div>
  );
}
