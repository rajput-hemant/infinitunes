import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { space } from "~/theme/tokens";

/**
 * Bottom padding of a form sheet's scroll content. Android draws edge to
 * edge, so a sheet's last row would sit under the 3-button navigation bar:
 * clear it plus a page gutter. iOS sheets inset their own content.
 */
export function useSheetBottomInset(): number {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === "android" ? bottom + space.lg : 0;
}
