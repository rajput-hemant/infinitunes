// Pure generators for the Android App Actions / launcher-shortcut resources.
// No Expo imports: `index.ts` writes these files, `shortcuts.test.ts` pins them.
// Every deep link here is routed by the app itself (`src/app/+native-intent.tsx`
// and the expo-router tree); this file only emits them.

export const DEEP_LINK_SCHEME = "infinitunes";

export const LINKS = {
  resume: `${DEEP_LINK_SCHEME}://action/resume`,
  playSearch: `${DEEP_LINK_SCHEME}://action/play-search`,
  search: `${DEEP_LINK_SCHEME}://search`,
  library: `${DEEP_LINK_SCHEME}://library`,
  likedSongs: `${DEEP_LINK_SCHEME}://me/liked-songs`,
  playlists: `${DEEP_LINK_SCHEME}://me/playlists`,
  recentlyPlayed: `${DEEP_LINK_SCHEME}://me/recently-played`,
} as const;

export type ShortcutIcon =
  | "play"
  | "heart"
  | "search"
  | "library"
  | "queue"
  | "history";

type Shortcut = {
  id: string;
  /** Short label, at most 10 characters (launchers truncate it). */
  shortLabel: string;
  longLabel: string;
  icon: ShortcutIcon;
  link: string;
  /** Spoken names for `actions.intent.OPEN_APP_FEATURE`; omit to keep the shortcut launcher-only. */
  featureNames?: string[];
  /**
   * Launchers show at most four static shortcuts per activity. The rest are
   * `enabled="false"`: still usable by Assistant, never listed in the launcher.
   */
  launcher: boolean;
};

export const SHORTCUTS: readonly Shortcut[] = [
  {
    id: "resume",
    shortLabel: "Resume",
    longLabel: "Resume playing",
    icon: "play",
    link: LINKS.resume,
    launcher: true,
  },
  {
    id: "feature_liked_songs",
    shortLabel: "Liked",
    longLabel: "Liked songs",
    icon: "heart",
    link: LINKS.likedSongs,
    featureNames: [
      "liked songs",
      "my liked songs",
      "favorites",
      "favourites",
      "my likes",
    ],
    launcher: true,
  },
  {
    id: "feature_search",
    shortLabel: "Search",
    longLabel: "Search music",
    icon: "search",
    link: LINKS.search,
    featureNames: ["search"],
    launcher: true,
  },
  {
    id: "feature_library",
    shortLabel: "Library",
    longLabel: "Your library",
    icon: "library",
    link: LINKS.library,
    featureNames: ["library", "my library", "my music"],
    launcher: true,
  },
  {
    id: "feature_playlists",
    shortLabel: "Playlists",
    longLabel: "Your playlists",
    icon: "queue",
    link: LINKS.playlists,
    featureNames: ["playlists", "my playlists"],
    launcher: false,
  },
  {
    id: "feature_recently_played",
    shortLabel: "Recent",
    longLabel: "Recently played",
    icon: "history",
    link: LINKS.recentlyPlayed,
    featureNames: [
      "recently played",
      "history",
      "listening history",
      "recents",
    ],
    launcher: false,
  },
];

const OPEN_APP_FEATURE = "actions.intent.OPEN_APP_FEATURE";
const GET_THING = "actions.intent.GET_THING";

export const MAIN_ACTIVITY_NAME = ".MainActivity";
export const PLAY_FROM_SEARCH_ACTIVITY = "PlayFromSearchActivity";

const shortLabelName = (s: Shortcut) => `shortcut_${s.id}_short`;
const longLabelName = (s: Shortcut) => `shortcut_${s.id}_long`;
const namesArray = (s: Shortcut) => `${s.id}_names`;
const iconName = (icon: ShortcutIcon) => `ic_shortcut_${icon}`;

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Android string resources need `'` escaped with a backslash. */
function androidString(value: string): string {
  return escapeXml(value).replaceAll("&apos;", "\\'");
}

/** `res/values/strings.xml` items (merged into the app's file by the plugin). */
export function buildStrings(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of SHORTCUTS) {
    out[shortLabelName(s)] = s.shortLabel;
    out[longLabelName(s)] = s.longLabel;
  }
  return out;
}

/** `res/values/app_actions_arrays.xml`: the spoken names Assistant matches a feature against. */
export function buildArraysXml(): string {
  const arrays = SHORTCUTS.filter((s) => s.featureNames).map(
    (s) =>
      `  <string-array name="${namesArray(s)}">\n${(s.featureNames ?? [])
        .map((n) => `    <item>${androidString(n)}</item>`)
        .join("\n")}\n  </string-array>`,
  );
  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${arrays.join("\n")}\n</resources>\n`;
}

export function buildShortcutsXml(applicationId: string): string {
  const target = `${applicationId}${MAIN_ACTIVITY_NAME}`;
  const shortcut = (s: Shortcut) => {
    const lines = [
      `  <shortcut`,
      `    android:shortcutId="${s.id}"`,
      `    android:enabled="${s.launcher}"`,
      `    android:icon="@drawable/${iconName(s.icon)}"`,
      `    android:shortcutShortLabel="@string/${shortLabelName(s)}"`,
      `    android:shortcutLongLabel="@string/${longLabelName(s)}">`,
      `    <intent`,
      `      android:action="android.intent.action.VIEW"`,
      `      android:data="${escapeXml(s.link)}"`,
      `      android:targetPackage="${applicationId}"`,
      `      android:targetClass="${target}" />`,
    ];
    if (s.featureNames) {
      lines.push(
        `    <capability-binding android:key="${OPEN_APP_FEATURE}">`,
        `      <parameter-binding android:key="feature" android:value="@array/${namesArray(s)}" />`,
        `    </capability-binding>`,
      );
    }
    lines.push(`  </shortcut>`);
    return lines.join("\n");
  };

  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by plugins/android-app-actions. Do not edit: \`expo prebuild\` rewrites it. -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- "Open Liked songs on Infinitunes": Assistant picks the shortcut whose names match
       and fulfils through that shortcut's own deep-link intent. The capability's
       own intent is the required parameter-less fallback. -->
  <capability android:name="${OPEN_APP_FEATURE}">
    <shortcut-fulfillment>
      <parameter android:name="feature" />
    </shortcut-fulfillment>
    <intent android:action="android.intent.action.VIEW">
      <url-template android:value="${LINKS.library}" />
    </intent>
  </capability>

  <!-- "Search for <term> on Infinitunes". GET_THING is generic: Google documents it for en-US only. -->
  <capability android:name="${GET_THING}">
    <intent android:action="android.intent.action.VIEW">
      <url-template android:value="${LINKS.search}{?q}" />
      <parameter android:name="thing.name" android:key="q" android:required="true" />
    </intent>
    <intent android:action="android.intent.action.VIEW">
      <url-template android:value="${LINKS.search}" />
    </intent>
  </capability>

${SHORTCUTS.map(shortcut).join("\n\n")}

</shortcuts>
`;
}

const ICON_PATHS: Record<ShortcutIcon, string> = {
  play: "M8,5v14l11,-7z",
  heart:
    "M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z",
  search:
    "M15.5,14h-0.79l-0.28,-0.27C15.41,12.59 16,11.11 16,9.5 16,5.91 13.09,3 9.5,3S3,5.91 3,9.5 5.91,16 9.5,16c1.61,0 3.09,-0.59 4.23,-1.57l0.27,0.28v0.79l5,4.99L20.49,19l-4.99,-5zM9.5,14C7.01,14 5,11.99 5,9.5S7.01,5 9.5,5 14,7.01 14,9.5 11.99,14 9.5,14z",
  library:
    "M4,6H2v14c0,1.1 0.9,2 2,2h14v-2H4V6zM20,2H8c-1.1,0 -2,0.9 -2,2v12c0,1.1 0.9,2 2,2h12c1.1,0 2,-0.9 2,-2V4c0,-1.1 -0.9,-2 -2,-2zM20,16H8V4h12v12z",
  queue:
    "M15,6H3v2h12V6zM15,10H3v2h12v-2zM3,16h8v-2H3v2zM17,6v8.18c-0.31,-0.11 -0.65,-0.18 -1,-0.18 -1.66,0 -3,1.34 -3,3s1.34,3 3,3 3,-1.34 3,-3V8h3V6h-5z",
  history:
    "M13,3c-4.97,0 -9,4.03 -9,9H1l3.89,3.89 0.07,0.14L9,12H6c0,-3.87 3.13,-7 7,-7s7,3.13 7,7 -3.13,7 -7,7c-1.93,0 -3.68,-0.79 -4.94,-2.06l-1.42,1.42C8.27,19.99 10.51,21 13,21c4.97,0 9,-4.03 9,-9s-4.03,-9 -9,-9zM12,8v5l4.28,2.54 0.72,-1.21 -3.5,-2.08V8H12z",
};

/** Shortcut icons are not tinted by the launcher, so the fill is the brand teal (ARGB; `brand` in src/lib/notifications.ts), which reads on light and dark. */
const ICON_FILL = "#FF067F9A";

/** `res/drawable/<name>.xml` -> contents, one 24dp vector per icon in use. */
export function buildIconDrawables(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const icon of new Set(SHORTCUTS.map((s) => s.icon))) {
    out[iconName(icon)] = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path android:fillColor="${ICON_FILL}" android:pathData="${ICON_PATHS[icon]}" />
</vector>
`;
  }
  return out;
}

/**
 * Trampoline for the classic voice intent `android.media.action.MEDIA_PLAY_FROM_SEARCH`
 * ("Play <x> on Infinitunes"). The app has no native media browser service, so this
 * turns the intent's query extras into the `play-search` / `resume` deep link and
 * hands it to the main activity. It shows no UI.
 */
export function buildPlayFromSearchKotlin(applicationId: string): string {
  return `package ${applicationId}

import android.app.Activity
import android.app.SearchManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore

/** Generated by plugins/android-app-actions. Routes a voice "play from search" intent into the JS deep-link handler. */
class ${PLAY_FROM_SEARCH_ACTIVITY} : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // SearchManager.QUERY is always set for MEDIA_PLAY_FROM_SEARCH (the free-form
    // spoken text, possibly empty for "play music"); the structured extras are
    // only a fallback when it is blank.
    val query =
      listOf(
          intent.getStringExtra(SearchManager.QUERY),
          intent.getStringExtra(MediaStore.EXTRA_MEDIA_TITLE),
          intent.getStringExtra(MediaStore.EXTRA_MEDIA_ARTIST),
          intent.getStringExtra(MediaStore.EXTRA_MEDIA_ALBUM),
          intent.getStringExtra(MediaStore.EXTRA_MEDIA_PLAYLIST),
        )
        .firstOrNull { !it.isNullOrBlank() }
        ?.trim()
    val link =
      if (query == null) "${LINKS.resume}"
      else Uri.parse("${LINKS.playSearch}").buildUpon().appendQueryParameter("q", query).build().toString()
    try {
      startActivity(
        Intent(Intent.ACTION_VIEW, Uri.parse(link))
          .setClassName(packageName, "$packageName${MAIN_ACTIVITY_NAME}")
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    } catch (_: ActivityNotFoundException) {}
    finish()
  }
}
`;
}
