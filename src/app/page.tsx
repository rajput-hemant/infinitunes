import { api } from "@/lib/jiosaavn-api";
import { ItemCard } from "@/components/item-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const HomePage = async () => {
  const homedata = await api.getHomeData();

  return (
    <div className="p-4">
      {homedata &&
        Object.entries(homedata).map(([key, section]) => {
          if (!("random_songs_listid" in section))
            return (
              <div key={key} className="w-full">
                <div className="mb-3">
                  <h3 className="text-2xl font-semibold">{section.title}</h3>

                  <p className="text-secondary-foreground/50">
                    {section.subtitle}
                  </p>
                </div>

                <ScrollArea>
                  <div className="flex space-x-4 pb-4">
                    {section.data.map(
                      ({ id, name, url, subtitle, type, image }) => (
                        <ItemCard
                          key={id}
                          id={id}
                          name={name}
                          url={url}
                          subtitle={subtitle}
                          type={type}
                          image={image}
                        />
                      )
                    )}
                  </div>

                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            );
        })}
    </div>
  );
};

export default HomePage;
