import { ItemCard } from "@/components/item-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { H2, Muted } from "@/components/ui/topography";
import { getHomeData } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";

export const revalidate = 3600; // revalidate page every hour

const HomePage = async () => {
  const homedata = await getHomeData();

  return (
    <div className="mb-4 space-y-4">
      {Object.entries(homedata).map(([key, section]) => {
        if (!("random_songs_listid" in section || key === "discover"))
          return (
            <>
              <header>
                <H2 className="pl-2 lg:pl-0">{section.title}</H2>

                <Muted className="-mt-2 pl-2 lg:p-0">{section.subtitle}</Muted>
              </header>

              <Separator />

              <ScrollArea>
                <div
                  className={cn(
                    "flex pb-6 sm:gap-2",
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
            </>
          );
      })}
    </div>
  );
};

export default HomePage;
