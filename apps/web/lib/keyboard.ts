/** Minimal element shape so the guards work in tests without a DOM. */
type ShortcutTarget = {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
};

export type ShortcutEvent = {
  key: string;
  target: EventTarget | ShortcutTarget | null;
  defaultPrevented?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const INTERACTIVE_TAGS = new Set(["BUTTON", "A", "SUMMARY"]);
const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "slider",
  "switch",
  "checkbox",
  "radio",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "combobox",
  "textbox",
  "searchbox",
  "spinbutton",
]);

function asTarget(target: ShortcutEvent["target"]): ShortcutTarget | null {
  return target && typeof target === "object"
    ? (target as ShortcutTarget)
    : null;
}

function isEditable(el: ShortcutTarget): boolean {
  return (
    EDITABLE_TAGS.has(el.tagName?.toUpperCase() ?? "") ||
    el.isContentEditable === true
  );
}

function isInteractive(el: ShortcutTarget): boolean {
  if (INTERACTIVE_TAGS.has(el.tagName?.toUpperCase() ?? "")) return true;
  const role = el.getAttribute?.("role");
  return role != null && INTERACTIVE_ROLES.has(role);
}

/**
 * Whether a global player shortcut must ignore this keydown. Shortcuts never
 * hijack text entry, modified chords (browser/OS shortcuts), or Space on a
 * focused control, where Space is the native activation key. When the user
 * has turned shortcuts off (`enabled: false`) every key is ignored.
 */
export function shouldIgnoreShortcut(
  event: ShortcutEvent,
  { enabled = true }: { enabled?: boolean } = {},
): boolean {
  if (!enabled) return true;
  if (event.defaultPrevented) return true;
  if (event.ctrlKey || event.metaKey || event.altKey) return true;

  const el = asTarget(event.target);
  if (!el) return false;
  if (isEditable(el)) return true;

  return event.key === " " && isInteractive(el);
}
