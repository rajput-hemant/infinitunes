import { router, useIsFocused } from "expo-router";
import { useEffect } from "react";

import { openCreatePlaylist } from "~/navigation/create-playlist";
import { useUserId } from "~/user-data/session";

/**
 * The Create tab's route. The tab is `disabled` (see the tabs layout): a tap
 * opens the New Playlist sheet and never selects it, so nothing renders here.
 * Tabs render eagerly, so being mounted means nothing; but if the route is
 * ever actually focused (typed href, `router.navigate("/create")`) it would be
 * a blank selected tab, so leave it for the previous tab (Home when there is
 * none) and open the sheet.
 */
export default function CreateTab() {
  const focused = useIsFocused();
  const userId = useUserId();

  useEffect(() => {
    if (!focused) return;
    if (router.canGoBack()) router.back();
    else router.replace("/");
    openCreatePlaylist(userId);
  }, [focused, userId]);

  return null;
}
