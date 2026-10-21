import fs from "node:fs";
import path from "node:path";

import {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
  type ConfigPlugin,
} from "expo/config-plugins";

// Node loads this through app.config.ts without a bundler: explicit extensions.
import {
  buildArraysXml,
  buildIconDrawables,
  buildPlayFromSearchKotlin,
  buildShortcutsXml,
  buildStrings,
  PLAY_FROM_SEARCH_ACTIVITY,
} from "./shortcuts.ts";

const SHORTCUTS_META = "android.app.shortcuts";
const MEDIA_PLAY_FROM_SEARCH = "android.media.action.MEDIA_PLAY_FROM_SEARCH";

function applicationIdOf(config: { android?: { package?: string } }): string {
  const id = config.android?.package;
  if (!id)
    throw new Error(
      "android-app-actions: set `android.package` in app.config.ts",
    );
  return id;
}

function write(file: string, contents: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/**
 * Google Assistant App Actions (`shortcuts.xml` capabilities) and launcher
 * shortcuts. See docs/mobile-assistants.md.
 */
const withAndroidAppActions: ConfigPlugin = (config) => {
  const applicationId = applicationIdOf(config);

  config = withStringsXml(config, (c) => {
    for (const [name, value] of Object.entries(buildStrings())) {
      c.modResults = AndroidConfig.Strings.setStringItem(
        [{ $: { name }, _: value.replaceAll("'", "\\'") }],
        c.modResults,
      );
    }
    return c;
  });

  config = withAndroidManifest(config, (c) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    // The plugin types omit an activity's `meta-data` children.
    const main = AndroidConfig.Manifest.getMainActivityOrThrow(
      c.modResults,
    ) as ReturnType<typeof AndroidConfig.Manifest.getMainActivityOrThrow> & {
      "meta-data"?: { $: Record<string, string> }[];
    };

    main["meta-data"] = [
      ...(main["meta-data"] ?? []).filter(
        (m) => m.$["android:name"] !== SHORTCUTS_META,
      ),
      {
        $: {
          "android:name": SHORTCUTS_META,
          "android:resource": "@xml/shortcuts",
        },
      },
    ];

    const name = `.${PLAY_FROM_SEARCH_ACTIVITY}`;
    app.activity = [
      ...(app.activity ?? []).filter((a) => a.$["android:name"] !== name),
      {
        $: {
          "android:name": name,
          "android:exported": "true",
          "android:excludeFromRecents": "true",
          "android:taskAffinity": "",
          "android:noHistory": "true",
          "android:theme": "@android:style/Theme.NoDisplay",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": MEDIA_PLAY_FROM_SEARCH } }],
            category: [
              { $: { "android:name": "android.intent.category.DEFAULT" } },
            ],
          },
        ],
      },
    ];
    return c;
  });

  return withDangerousMod(config, [
    "android",
    (c) => {
      const root = c.modRequest.platformProjectRoot;
      const res = path.join(root, "app/src/main/res");
      write(
        path.join(res, "xml/shortcuts.xml"),
        buildShortcutsXml(applicationId),
      );
      write(path.join(res, "values/app_actions_arrays.xml"), buildArraysXml());
      for (const [name, xml] of Object.entries(buildIconDrawables())) {
        write(path.join(res, "drawable", `${name}.xml`), xml);
      }
      write(
        path.join(
          root,
          "app/src/main/java",
          ...applicationId.split("."),
          `${PLAY_FROM_SEARCH_ACTIVITY}.kt`,
        ),
        buildPlayFromSearchKotlin(applicationId),
      );
      return c;
    },
  ]);
};

export default withAndroidAppActions;
