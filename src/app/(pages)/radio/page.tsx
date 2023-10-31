import { Lang } from "@/types";
import { getFeaturedRadioStations } from "@/lib/jiosaavn-api";
import { ItemCard } from "@/components/item-card";
import LanguageBar from "@/components/language-bar";
import { Separator } from "@/components/ui/separator";
import { H2, H3 } from "@/components/ui/topography";

export const revalidate = 3600; // revalidate page every hour

type Props = { searchParams: { page?: number; lang?: Lang } };

const RadioPage = async ({ searchParams: { page = 1, lang } }: Props) => {
  const radioStations = await getFeaturedRadioStations(page, 50, lang);
  const heading = "Radio Stations";

  return (
    <div className="mb-4 space-y-4">
      <H2 className="pb-0 lg:hidden">{heading}</H2>

      <LanguageBar type="radio" language={lang} />

      <Separator />

      <H2 className="hidden lg:block">{heading}</H2>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {radioStations.map(
          ({ id, name, url, subtitle, type, image, explicit }) => (
            <ItemCard
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

      <H3 className="text-center">
        <em>Yay! You have seen it all</em> 🤩
      </H3>
    </div>
  );
};

export default RadioPage;
