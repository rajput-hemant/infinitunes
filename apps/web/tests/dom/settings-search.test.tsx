import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { setInputValue } from "./set-input-value";
import { requireElement } from "./settings-test-utils";

mock.module("../../lib/theme/actions", () => ({
  saveThemeConfig: async () => {},
}));

const { LiquidGlassSettings } =
  await import("../../app/(root)/settings/_components/liquid-glass-settings");
const { SettingsCard } =
  await import("../../app/(root)/settings/_components/settings-card");
const { SettingsRow } =
  await import("../../app/(root)/settings/_components/settings-row");
const { SettingsEmpty, SettingsSearchField, SettingsSearchProvider } =
  await import("../../app/(root)/settings/_components/settings-search");
const { matchesQuery } =
  await import("../../app/(root)/settings/_components/settings-match");
const { ThemeConfigProvider } = await import("../../lib/theme/provider");

const mounted: Root[] = [];

afterEach(async () => {
  await act(async () => {
    for (const root of mounted.splice(0)) root.unmount();
  });
  document.body.innerHTML = "";
});

async function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push(root);
  await act(async () => {
    root.render(<ThemeConfigProvider>{node}</ThemeConfigProvider>);
  });
  return container;
}

function page() {
  return (
    <SettingsSearchProvider>
      <SettingsSearchField />
      <SettingsCard title="Typography">
        <SettingsRow label="Interface font" help="Body text and controls.">
          <span>fonts</span>
        </SettingsRow>
        <SettingsRow label="Text size" help="Layout scales." keywords="zoom">
          <span>sizes</span>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard title="Playback">
        <SettingsRow label="Stream Quality" help="Higher uses more data.">
          <span>quality</span>
        </SettingsRow>
      </SettingsCard>
      <SettingsEmpty />
    </SettingsSearchProvider>
  );
}

const search = (container: HTMLElement) =>
  requireElement(container, "input[type=search]", HTMLInputElement);

/** The labels of the rows that are not hidden. */
function visibleRows(container: HTMLElement) {
  return [...container.querySelectorAll("[data-settings-row]")]
    .filter((row) => !row.hasAttribute("hidden"))
    .map((row) => row.querySelector("p")?.textContent);
}

describe("matchesQuery", () => {
  it("is case insensitive, needs every word and matches anything on an empty query", () => {
    expect(matchesQuery("Stream Quality", "")).toBe(true);
    expect(matchesQuery("Stream Quality", "  ")).toBe(true);
    expect(matchesQuery("Stream Quality", "QUAL")).toBe(true);
    expect(matchesQuery("Stream Quality", "stream data")).toBe(false);
    expect(matchesQuery("Stream Quality more data", "stream data")).toBe(true);
  });
});

describe("settings search", () => {
  it("shows every row until something is typed", async () => {
    const container = await mount(page());
    expect(visibleRows(container)).toEqual([
      "Interface font",
      "Text size",
      "Stream Quality",
    ]);
    expect(container.querySelector("[data-searching]")).toBeNull();
  });

  it("filters rows by label, help and keywords and marks the page as searching", async () => {
    const container = await mount(page());

    await act(async () => setInputValue(search(container), "quality"));
    expect(visibleRows(container)).toEqual(["Stream Quality"]);
    expect(container.querySelector("[data-searching]")).not.toBeNull();

    await act(async () => setInputValue(search(container), "ZOOM"));
    expect(visibleRows(container)).toEqual(["Text size"]);

    await act(async () => setInputValue(search(container), "body text"));
    expect(visibleRows(container)).toEqual(["Interface font"]);

    await act(async () => setInputValue(search(container), ""));
    expect(visibleRows(container)).toHaveLength(3);
  });

  it("flags the empty state when nothing matches", async () => {
    const container = await mount(page());
    expect(container.querySelector("[data-empty]")).toBeNull();

    await act(async () => setInputValue(search(container), "zzz"));
    expect(visibleRows(container)).toEqual([]);
    expect(container.querySelector("[data-empty]")).not.toBeNull();
    expect(container.textContent).toContain("No settings match");

    await act(async () => setInputValue(search(container), "text"));
    expect(container.querySelector("[data-empty]")).toBeNull();
  });

  it("focuses the field on / unless a text field has focus, and Escape clears it", async () => {
    const container = await mount(page());
    const field = search(container);

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: "/", bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(field);

    await act(async () => setInputValue(field, "font"));
    await act(async () => {
      field.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(field.value).toBe("");
    expect(visibleRows(container)).toHaveLength(3);
  });

  it("does not steal / typed into another input", async () => {
    const container = await mount(
      <>
        {page()}
        <input aria-label="other" />
      </>,
    );
    const other = requireElement(
      container,
      "input[aria-label=other]",
      HTMLInputElement,
    );
    other.focus();
    const event = new KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      other.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  it("opens the collapsed lens fine-tune when a lens control matches", async () => {
    const container = await mount(
      <SettingsSearchProvider>
        <SettingsSearchField />
        <LiquidGlassSettings />
      </SettingsSearchProvider>,
    );
    const toggle = requireElement(
      container,
      "button[aria-label='Fine-tune the lens']",
      HTMLButtonElement,
    );
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await act(async () => setInputValue(search(container), "chromatic"));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(visibleRows(container).filter(Boolean)).toContain("Chromatic");
    expect(visibleRows(container)).not.toContain("Glass level");

    await act(async () => setInputValue(search(container), ""));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
