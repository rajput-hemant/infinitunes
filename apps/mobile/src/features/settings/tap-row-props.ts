export type TapRowProps = {
  label: string;
  /** A second line under the label. */
  detail?: string;
  onPress: () => void;
};

export type ActionRowProps = TapRowProps & {
  /** Colours the label red, for sign out and delete. */
  destructive?: boolean;
};
