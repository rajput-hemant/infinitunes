import type { CardItem } from "@infinitunes/types";
import { View } from "react-native";

import { QuickPickTile } from "~/components/quick-pick-tile";
import { SectionHeader } from "~/components/section-header";
import { GRID_GAP, useGridCardWidth } from "~/lib/use-grid-card-width";
import { usePending } from "~/lib/use-pending";
import { entityHref } from "~/navigation/entity-href";

import { playSurprise } from "./play-home";

/**
 * Surprise Me and Browse, then new albums and playlists as compact tiles to
 * jump straight in. A tile opens its item; its long press offers Play.
 */
export function QuickPicks({ items }: { items: readonly CardItem[] }) {
  const width = useGridCardWidth();
  // A tap while a batch is loading is ignored.
  const { run } = usePending();

  return (
    <View>
      <SectionHeader title="Quick picks" />
      <View className="flex-row flex-wrap px-page" style={{ gap: GRID_GAP }}>
        <QuickPickTile
          width={width}
          title="Surprise Me"
          leading={{ icon: { ios: "sparkles", android: "auto_awesome" } }}
          onPress={() => void run(playSurprise)}
        />
        <QuickPickTile
          width={width}
          title="Browse"
          leading={{ icon: { ios: "square.grid.2x2", android: "grid_view" } }}
          href="/browse"
        />
        {items.map((item) => (
          <QuickPickTile
            key={`${item.type}-${item.id}`}
            width={width}
            title={item.name}
            leading={{ artwork: item.image }}
            href={entityHref(item.type, item.url)}
            item={item}
          />
        ))}
      </View>
    </View>
  );
}
