import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { SliderList } from "../../components/slider/slider-list";

describe("SliderList", () => {
  it("renders nothing for an empty shelf (no heading, no arrows)", () => {
    expect(
      renderToStaticMarkup(<SliderList title="Artists" items={[]} />),
    ).toBe("");
  });
});
