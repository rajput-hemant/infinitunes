import { ItemCard } from "@/components/item-card";
import { Separator } from "@/components/ui/separator";
import { H2, H3 } from "@/components/ui/topography";
import { getCharts } from "@/lib/jiosaavn-api";

export const revalidate = 3600; // revalidate page every hour

const ChartsPage = async () => {
  const charts = await getCharts();
  const heading = "Top Music Charts";

  return (
    <div className="mb-4 space-y-4">
      <H2 className="pb-0 lg:hidden">{heading}</H2>
      <Separator className="lg:hidden" />
      <H2 className="hidden lg:block">{heading}</H2>
      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {charts.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <ItemCard
            key={id}
            name={name}
            url={url}
            subtitle={subtitle}
            type={type}
            image={image}
            explicit={explicit}
            aspect="video"
          />
        ))}
      </div>

      <H3 className="text-center">
        <em>Yay! You have seen it all</em> 🤩
      </H3>
    </div>
  );
};

export default ChartsPage;
