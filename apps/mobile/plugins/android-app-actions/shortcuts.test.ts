import {
  buildArraysXml,
  buildIconDrawables,
  buildPlayFromSearchKotlin,
  buildShortcutsXml,
  buildStrings,
  SHORTCUTS,
} from "./shortcuts.ts";

const ID = "com.infinitunes.app";

describe("android app actions resources", () => {
  const xml = buildShortcutsXml(ID);

  it("maps the BIIs onto the deep links", () => {
    expect(xml).toContain('android:name="actions.intent.OPEN_APP_FEATURE"');
    expect(xml).toContain('android:name="actions.intent.GET_THING"');
    expect(xml).toContain('android:value="infinitunes://search{?q}"');
    expect(xml).toContain(
      '<parameter android:name="thing.name" android:key="q"',
    );
  });

  it("targets the main activity and lists four launcher shortcuts", () => {
    expect(xml).toContain(`android:targetClass="${ID}.MainActivity"`);
    expect(SHORTCUTS.filter((s) => s.launcher)).toHaveLength(4);
    expect(xml.match(/android:enabled="true"/g)).toHaveLength(4);
  });

  it("only references labels, arrays and icons that are generated", () => {
    const strings = buildStrings();
    const arrays = buildArraysXml();
    const icons = buildIconDrawables();
    for (const [, name] of xml.matchAll(/@string\/(\w+)/g)) {
      expect(strings).toHaveProperty(name!);
    }
    for (const [, name] of xml.matchAll(/@array\/(\w+)/g)) {
      expect(arrays).toContain(`name="${name}"`);
    }
    for (const [, name] of xml.matchAll(/@drawable\/(\w+)/g)) {
      expect(icons).toHaveProperty(name!);
    }
    for (const label of Object.entries(strings)) {
      if (label[0].endsWith("_short")) {
        expect(label[1].length).toBeLessThanOrEqual(10);
      }
    }
  });

  it("builds the trampoline for the application id", () => {
    const kotlin = buildPlayFromSearchKotlin(ID);
    expect(kotlin).toContain(`package ${ID}`);
    expect(kotlin).toContain("infinitunes://action/play-search");
    expect(kotlin).toContain("infinitunes://action/resume");
  });

  it("prefers the free-form query over the structured media extras", () => {
    const kotlin = buildPlayFromSearchKotlin(ID);
    const order = [
      "SearchManager.QUERY",
      "MediaStore.EXTRA_MEDIA_TITLE",
      "MediaStore.EXTRA_MEDIA_ARTIST",
    ].map((extra) => kotlin.indexOf(`getStringExtra(${extra})`));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual(order.toSorted((x, y) => x - y));
  });
});
