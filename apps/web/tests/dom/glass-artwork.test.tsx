import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { GlassAmbient } from "../../components/glass/glass-ambient";
import {
  getGlassArtwork,
  setGlassArtwork,
} from "../../components/glass/glass-store";
import { useGlassArtwork } from "../../hooks/use-glass-artwork";

const roots: Root[] = [];
const html = document.documentElement;

async function mount(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const reactRoot = createRoot(container);
  roots.push(reactRoot);
  await act(async () => {
    reactRoot.render(ui);
  });
  return { container, reactRoot };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  setGlassArtwork(null);
  html.removeAttribute("style");
});

function Player({ url }: { url: string | null }) {
  useGlassArtwork(url);
  return null;
}

describe("GlassAmbient", () => {
  it("renders the colour field without an image until artwork plays", async () => {
    const { container } = await mount(<GlassAmbient />);
    const field = container.querySelector("[data-glass-ambient]");
    expect(field).not.toBeNull();
    expect(field?.getAttribute("aria-hidden")).toBe("true");
    expect(field?.querySelector("img")).toBeNull();
  });

  it("shows the playing artwork, and removes it when playback ends", async () => {
    const { container } = await mount(<GlassAmbient />);
    await act(async () => setGlassArtwork("https://cdn.test/a.jpg"));
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn.test/a.jpg",
    );
    await act(async () => setGlassArtwork(null));
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("useGlassArtwork", () => {
  it("publishes the artwork to the ambient field and clears it on unmount", async () => {
    const { reactRoot } = await mount(<Player url="https://cdn.test/b.jpg" />);
    expect(getGlassArtwork()).toBe("https://cdn.test/b.jpg");
    await act(async () => reactRoot.unmount());
    expect(getGlassArtwork()).toBeNull();
  });

  it("follows the track, and clears the tint when nothing plays", async () => {
    html.style.setProperty("--g-art-l", "0.9");
    const { reactRoot } = await mount(<Player url="https://cdn.test/c.jpg" />);
    await act(async () =>
      reactRoot.render(<Player url="https://cdn.test/d.jpg" />),
    );
    expect(getGlassArtwork()).toBe("https://cdn.test/d.jpg");
    await act(async () => reactRoot.render(<Player url={null} />));
    expect(getGlassArtwork()).toBeNull();
    expect(html.style.getPropertyValue("--g-art-l")).toBe("");
  });
});
