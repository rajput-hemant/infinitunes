import { describe, expect, it } from "bun:test";

import type { AllSearch } from "@infinitunes/types";
import { renderToStaticMarkup } from "react-dom/server";

import { SearchAll } from "../components/search/search-all";
import { SliderCard } from "../components/slider/slider-card";

const IMAGE = "https://c.saavncdn.com/x-150x150.jpg";

describe("upstream strings are decoded", () => {
  it("slider-card renders decoded name and subtitle, not raw entities", () => {
    const html = renderToStaticMarkup(
      <SliderCard
        name="Rock &amp; Roll &#039;99"
        subtitle="Simon &amp; Garfunkel"
        type="album"
        url="https://www.jiosaavn.com/album/rock/abc123"
        image={IMAGE}
        hidePlayButton
      />,
    );

    // The only entity left is React's own single-pass escape of a literal "&".
    expect(html).toContain("Rock &amp; Roll &#x27;99");
    expect(html).toContain("Simon &amp; Garfunkel");
    expect(html).not.toContain("&amp;amp;");
    expect(html).not.toContain("&amp;#039;");
  });

  it("search-all renders decoded title/subtitle and an empty image alt", () => {
    const data = {
      songs_query: {
        position: 1,
        data: [
          {
            id: "s1",
            title: "Tom &amp; Jerry",
            subtitle: "A &amp; B",
            perma_url: "https://www.jiosaavn.com/song/tom/s1",
            type: "song",
            image: IMAGE,
          },
        ],
      },
    } as unknown as AllSearch;

    const html = renderToStaticMarkup(<SearchAll query="tom" data={data} />);

    expect(html).toContain("Tom &amp; Jerry");
    expect(html).toContain("A &amp; B");
    expect(html).not.toContain("&amp;amp;");
    expect(html).toContain('alt=""');
  });
});
