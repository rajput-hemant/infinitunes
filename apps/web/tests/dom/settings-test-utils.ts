import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** A router stub for components that navigate; `record` receives each call as text. */
export function createTestRouter(
  record: (call: string) => void = () => {},
): AppRouterInstance {
  return {
    push: (href) => record(`push ${href}`),
    replace: (href) => record(`replace ${href}`),
    refresh: () => record("refresh"),
    back() {},
    forward() {},
    prefetch() {},
    bfcacheId: "test",
  };
}

/** The first element matching `selector`; throws when it is missing or of another kind. */
export function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
  kind: abstract new () => T,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof kind)) {
    throw new Error(`No element matches ${selector}`);
  }
  return element;
}

/** The button whose visible text is `name`; throws when there is none. */
export function findButton(root: ParentNode, name: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === name,
  );
  if (!button) throw new Error(`No button named ${name}`);
  return button;
}
