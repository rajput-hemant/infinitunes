import { SliderCard } from "@/components/slider";
import { getCharts } from "@/lib/jiosaavn-api";

const title = "Top Music Charts";
const description = "Listen to the top music charts from around the world.";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/chart",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/eaa488b6fbcd332148569.png`,
      alt: "Top Music Charts",
    },
  },
};
export default async function ChartsPage() {
  const charts = await getCharts();

  return (
    <div className="space-y-4">
      <h1 className="mt-4 font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        Top Music Charts
      </h1>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {charts.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <SliderCard
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

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        <em>Yay! You have seen it all</em>{" "}
        <span className="text-foreground">🤩</span>
      </h3>
    </div>
  );
}
