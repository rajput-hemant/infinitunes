import { afterEach, describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { LanguagePicker } from "../../components/site-header/language-picker";
import { waitFor } from "./wait-for";

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
const popup = () =>
  document.querySelector("[role=dialog], [data-slot=drawer-popup]");

/** The popup is its own chunk: a click starts the import and opens it once it lands. */
async function openPicker(container: HTMLElement) {
  await act(async () =>
    (container.querySelector("button") as HTMLButtonElement).click(),
  );
  await waitFor(() => popup() !== null);
}

describe("language picker popover", () => {
  afterEach(async () => {
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    refresh.mockClear();
    window.matchMedia = realMatchMedia;
    document.cookie = "language=; path=/; max-age=0";
  });

  it("opens a labelled dialog from the trigger", async () => {
    const container = await mount();
    const trigger = () =>
      container.querySelector("button") as HTMLButtonElement;
    expect(dialog()).toBeNull();
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");

    await openPicker(container);

    const open = dialog() as HTMLElement;
    expect(open).not.toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const labelledBy = open.getAttribute("aria-labelledby");
    expect(document.getElementById(labelledBy ?? "")?.textContent).toBe(
      "Languages",
    );
  });

  it("saves the selection and refreshes", async () => {
    const container = await mount();
    await openPicker(container);

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
    await openPicker(container);

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

  it("keeps several languages selected and saves them together", async () => {
    const container = await mount();
    await openPicker(container);
    const open = dialog() as HTMLElement;
    const english = [
      ...open.querySelectorAll<HTMLElement>("[aria-pressed]"),
    ].find((el) => el.textContent === "English");
    await act(async () => english?.click());

    const save = [...open.querySelectorAll("button")].find(
      (b) => b.textContent === "Save",
    ) as HTMLButtonElement;
    await act(async () => save.click());

    const saved = decodeURIComponent(document.cookie);
    expect(saved).toContain("hindi");
    expect(saved).toContain("english");
  });

  it("hides the decorative chevron and drops an unsaved selection on close", async () => {
    const container = await mount();
    const trigger = () =>
      container.querySelector("button") as HTMLButtonElement;
    expect(trigger().querySelector("svg:not([aria-hidden])")).toBeNull();

    const chips = () =>
      [...document.querySelectorAll<HTMLElement>("[aria-pressed]")].filter(
        (el) => el.getAttribute("role") !== "dialog",
      );
    const pressed = () =>
      chips()
        .filter((el) => el.getAttribute("aria-pressed") === "true")
        .map((el) => el.textContent);

    await openPicker(container);
    expect(pressed()).toEqual(["Hindi"]);

    const other = chips().find((el) => el.textContent !== "Hindi");
    await act(async () => other?.click());
    expect(pressed()).toEqual(["Hindi", other?.textContent ?? ""]);

    await act(async () => trigger().click());
    await act(async () => new Promise((r) => setTimeout(r, 50)));
    await openPicker(container);
    expect(pressed()).toEqual(["Hindi"]);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("loads the popup on intent and swaps in the same closed trigger", async () => {
    const container = await mount();
    const closed = container.querySelector("button") as HTMLButtonElement;
    const markup = closed.outerHTML.replace(/ id="[^"]*"/, "");
    expect(closed.getAttribute("data-deferred")).toBe("languages");

    await act(async () => {
      closed.dispatchEvent(new Event("pointerover", { bubbles: true }));
      closed.dispatchEvent(new Event("pointerenter"));
    });
    await waitFor(() => container.querySelector("button") !== closed);

    const real = container.querySelector("button") as HTMLButtonElement;
    expect(dialog()).toBeNull();
    expect(real.getAttribute("aria-expanded")).toBe("false");
    expect(real.getAttribute("aria-haspopup")).toBe("dialog");
    // Same classes and content: the swap is not visible.
    expect(real.className).toBe(closed.className);
    expect(real.textContent).toBe(closed.textContent);
    expect(markup).toContain("Choose languages");
  });
});
