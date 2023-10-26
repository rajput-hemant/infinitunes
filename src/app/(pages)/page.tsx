import { getHomeData } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { ItemCard } from "@/components/item-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { H2, Muted } from "@/components/ui/topography";

export const dynamic = "force-dynamic"; // always fetch on page load

const HomePage = async () => {
  const homedata = await getHomeData();

  return (
    <>
      {Object.entries(homedata).map(([key, section]) => {
        if (!("random_songs_listid" in section || key === "discover"))
          return (
            <div key={key} className="w-full">
              <H2 className="pl-2 lg:pl-0">{section.title}</H2>

              <Muted className="-mt-2 mb-2 pl-2 lg:p-0">
                {section.subtitle}
              </Muted>

              <ScrollArea>
                <div
                  className={cn(
                    "flex gap-4 pb-6",
                    ["trending", "albums", "charts"].includes(key) &&
                      "grid grid-flow-col grid-rows-2 place-content-start"
                  )}
                >
                  {section.data.map(
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

                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          );
      })}
    </>
  );
};

export default HomePage;
