import { afterEach, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { useIsHydrated } from "../../hooks/use-is-hydrated";

const roots: Root[] = [];

function Probe() {
  const hydrated = useIsHydrated();
  return <output>{hydrated ? "hydrated" : "pending"}</output>;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("reports pending on the server render and hydrated once the client mounts", async () => {
  expect(renderToString(<Probe />)).toContain("pending");

  const container = document.createElement("div");
  container.innerHTML = renderToString(<Probe />);
  document.body.append(container);

  await act(async () => {
    roots.push(hydrateRoot(container, <Probe />));
  });

  expect(container.textContent).toBe("hydrated");
});

it("reports hydrated for a client-only mount", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);

  await act(async () => root.render(<Probe />));

  expect(container.textContent).toBe("hydrated");
});
