import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { tabStackOptions } from "./tab-stack-options";

// Jest defaults to iOS resolution; exercise the Android implementation explicitly.
jest.mock("./tab-stack-options", () =>
  jest.requireActual("./tab-stack-options.ts"),
);

const tabs = join(__dirname, "../app/(tabs)");
const shared = join(tabs, "(home,search,library,radio)");
const detailRoutes = readdirSync(shared, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
  .map((entry) =>
    relative(shared, join(entry.parentPath, entry.name)).replace(/\.tsx$/, ""),
  )
  .filter((name) => name.includes("[token]"));

it.each(["home", "search", "library", "radio"])(
  "installs static screen options on the %s stack",
  (tab) => {
    const layout = readFileSync(join(tabs, `(${tab})/_layout.tsx`), "utf8");
    expect(layout).toContain("screenOptions={tabStackOptions}");
  },
);

it.each(detailRoutes)(
  "starts %s with the final Android header geometry",
  (name) => {
    const options = tabStackOptions({ route: { name } });
    expect(options).toMatchObject({
      title: "",
      headerTitle: "",
      headerTransparent: true,
      headerLargeTitle: false,
      headerShadowVisible: false,
    });
    expect(options.headerBackground?.()).toBeNull();
  },
);

it("does not make root, list or account headers transparent", () => {
  for (const name of [
    "index",
    "search",
    "library",
    "radio/index",
    "album/index",
    "settings",
  ]) {
    const options = tabStackOptions({ route: { name } });
    expect(options.title).toBe("");
    expect(options.headerTransparent).toBeUndefined();
  }
});
