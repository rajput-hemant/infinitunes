import type { Lang } from "@/types";

import { LanguageBar } from "@/components/language-bar";
import { SliderCard } from "@/components/slider";
import { getFeaturedRadioStations } from "@/lib/jiosaavn-api";

const title = "Top Indian Radio Stations";
const description =
  "Listen to the top Indian radio stations online. Stream live music, news, sports, and talk radio from India.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/radio",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/857b2fc40944dbb65b184.png`,
      alt: "Top Indian Music Artists",
    },
  },
};

type Props = {
  searchParams: Promise<{
    page?: number;
    lang?: Lang;
  }>;
};

export default async function RadioPage(props: Props) {
  const { page = 1, lang } = await props.searchParams;

  const radioStations = await getFeaturedRadioStations(page, 50, lang);

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        Radio Stations
      </h1>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {radioStations.map(
          ({ id, name, url, subtitle, type, image, explicit }) => (
            <SliderCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit}
            />
          )
        )}
      </div>

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        <em>Yay! You have seen it all</em>{" "}
        <span className="text-foreground">🤩</span>
      </h3>
    </div>
  );
}
