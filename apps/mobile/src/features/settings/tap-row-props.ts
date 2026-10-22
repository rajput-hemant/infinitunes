import type { SymbolName } from "~/components/ui/icon";

/** An SF Symbol name (iOS row icons). */
export type SFSymbol = Extract<SymbolName, string>;

export type TapRowProps = {
  label: string;
  /** A second line under the label. */
  detail?: string;
  onPress: () => void;
  /** A tinted leading icon (iOS). */
  icon?: { name: SFSymbol; color?: string };
};

export type ActionRowProps = TapRowProps & {
  /** Colours the label red, for sign out and delete. */
  destructive?: boolean;
};
