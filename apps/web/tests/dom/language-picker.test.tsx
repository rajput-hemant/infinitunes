import { afterEach, describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { LanguagePicker } from "../../components/site-header/language-picker";

const realMatchMedia = window.matchMedia;

function setPhone(isPhone: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isPhone,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const refresh = mock(() => {});
const router = { refresh } as never;

const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <LanguagePicker initialLanguages={["hindi"]} />
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

const dialog = () => document.querySelector("[role=dialog]");

describe("language picker popover", () => {
  afterEach(async () => {
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    refresh.mockClear();
    window.matchMedia = realMatchMedia;
    document.cookie = "language=; path=/; max-age=0";
  });

  it("opens a labelled dialog from the trigger", async () => {
    const container = await mount();
    const trigger = container.querySelector("button") as HTMLButtonElement;
    expect(dialog()).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await act(async () => trigger.click());

    const popup = dialog() as HTMLElement;
    expect(popup).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const labelledBy = popup.getAttribute("aria-labelledby");
    expect(document.getElementById(labelledBy ?? "")?.textContent).toBe(
      "Languages",
    );
  });

  it("saves the selection and refreshes", async () => {
    const container = await mount();
    await act(async () =>
      (container.querySelector("button") as HTMLButtonElement).click(),
    );

    const save = [...(dialog() as HTMLElement).querySelectorAll("button")].find(
      (b) => b.textContent === "Save",
    ) as HTMLButtonElement;
    await act(async () => save.click());

    expect(document.cookie).toContain("language=hindi");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("opens a bottom sheet with the same chips and Save below 768px", async () => {
    setPhone(true);
    const container = await mount();
    await act(async () =>
      (container.querySelector("button") as HTMLButtonElement).click(),
    );

    const sheet = document.querySelector("[data-slot=drawer-popup]");
    expect(sheet).not.toBeNull();
    expect(sheet?.querySelectorAll("[aria-pressed]").length).toBeGreaterThan(3);

    const save = [...(sheet as HTMLElement).querySelectorAll("button")].find(
      (b) => b.textContent === "Save",
    ) as HTMLButtonElement;
    await act(async () => save.click());

    expect(document.cookie).toContain("language=hindi");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
