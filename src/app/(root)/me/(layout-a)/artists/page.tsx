import { Construction } from "lucide-react";

export default function LikedArtistsPage() {
  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-md border border-dashed lg:h-[25rem]">
      <Construction
        size={64}
        className="fill-yellow-500 dark:fill-black dark:stroke-yellow-500"
      />

      <h3 className="py-6 text-center font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        Under development. <br /> Please check back later.
      </h3>
    </div>
  );
}
