import { SliderCard } from "~/components/slider/slider-card";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

const title = "Top Music Charts";
const description = "Listen to the top music charts from around the world.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/chart",
  image: "https://graph.org/file/eaa488b6fbcd332148569.png",
  alt: "Top Music Charts",
});
export default async function ChartsPage() {
  const charts = await api.get.charts({ page: 1, n: 50 });

  return (
    <div className="space-y-4">
      <h1 className="mt-4 font-heading text-2xl capitalize drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        Top Music Charts
      </h1>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {charts.map(
          ({
            id,
            title: chartTitle,
            perma_url,
            subtitle,
            type,
            image,
            explicit_content,
          }) => (
            <SliderCard
              key={id}
              name={chartTitle}
              url={perma_url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit_content}
              aspect="video"
            />
          ),
        )}
      </div>

      <h2 className="py-6 text-center font-heading text-xl drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
        <em>Yay! You have seen it all</em>{" "}
        <span className="text-foreground">🤩</span>
      </h2>
    </div>
  );
}
