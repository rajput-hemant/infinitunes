import { SliderCard } from "@/components/slider";
import { getTopArtists } from "@/lib/jiosaavn-api";

export default async function TopArtistsPage() {
  const topArtists = await getTopArtists();

  return (
    <div className="my-4 space-y-4">
      <h1 className="font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        Top Artists
      </h1>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {topArtists.map(({ id, name, url, follower_count, image }) => (
          <SliderCard
            key={id}
            name={name}
            url={url}
            subtitle={`${follower_count.toLocaleString()} Fans`}
            type="artist"
            image={image}
          />
        ))}
      </div>

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
        <em>Yay! You have seen it all</em> 🤩
      </h3>
    </div>
  );
}
