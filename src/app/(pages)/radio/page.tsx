import { Lang } from "@/types";
import { getFeaturedRadioStations } from "@/lib/jiosaavn-api";
import { ItemCard } from "@/components/item-card";
import LanguageBar from "@/components/language-bar";
import { Separator } from "@/components/ui/separator";
import { H2, H3 } from "@/components/ui/topography";

type Props = { searchParams: { page?: string; lang?: Lang } };

const RadioPage = async ({ searchParams: { page = "1", lang } }: Props) => {
  const radioStations = await getFeaturedRadioStations(page, lang);
  const heading = "Radio Stations";

  return (
    <div className="space-y-4">
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

      <H3 className="text-center italic">Yay! You have seen it all 🤩</H3>
    </div>
  );
};

export default RadioPage;
