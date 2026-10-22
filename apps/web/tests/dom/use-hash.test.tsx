import { afterEach, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("next/navigation", () => ({ useParams: () => ({}) }));
const { useHash } = await import("../../hooks/use-hash");
let root: Root;
afterEach(async () => {
  await act(async () => root?.unmount());
  window.location.hash = "";
  document.body.replaceChildren();
});

it("treats malformed escapes as unknown and still decodes valid hashes", async () => {
  function Probe() {
    return <output>{useHash() ?? "unknown"}</output>;
  }
  window.location.hash = "%";
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Probe />));
  expect(host.textContent).toBe("unknown");
  await act(async () => {
    window.location.hash = "play%62ack";
    window.dispatchEvent(new Event("hashchange"));
  });
  expect(host.textContent).toBe("playback");
});
