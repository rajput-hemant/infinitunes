import { screen, within } from "@testing-library/react-native";

/** The nearest flex row above a title: the line its explicit badge leads. */
function titleRow(text: ReturnType<typeof screen.getByText>) {
  let row = text.parent;
  while (row && !String(row.props.className ?? "").includes("flex-row")) {
    row = row.parent;
  }
  if (!row) throw new Error("no title row");
  return row;
}

/**
 * The texts on a title line, in order. The badge is hidden from screen
 * readers, so hidden nodes are included.
 */
export function titleLineTexts(text: ReturnType<typeof screen.getByText>) {
  return within(titleRow(text))
    .getAllByText(/.+/, { includeHiddenElements: true })
    .map((node) => node.props.children);
}
