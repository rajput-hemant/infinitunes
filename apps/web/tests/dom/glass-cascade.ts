import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "postcss";
import type { AtRule, ChildNode, Rule } from "postcss";

/** A tiny cascade over styles/glass.css: enough to resolve which rule wins a custom property. */
export type Specificity = [number, number, number];

const glassCss = readFileSync(
  join(import.meta.dir, "../../styles/glass.css"),
  "utf8",
);

function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts.filter(Boolean);
}

function add(a: Specificity, b: Specificity): Specificity {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function compare(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function matchParen(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")" && --depth === 0) return i;
  }
  return source.length;
}

export function specificity(selector: string): Specificity {
  let total: Specificity = [0, 0, 0];
  let i = 0;
  while (i < selector.length) {
    const rest = selector.slice(i);
    const functional = /^:(is|not|where|has)\(/.exec(rest);
    if (functional) {
      const open = i + functional[0].length - 1;
      const close = matchParen(selector, open);
      if (functional[1] !== "where") {
        const args = splitTopLevel(selector.slice(open + 1, close)).map(
          specificity,
        );
        const widest = args.reduce(
          (max, s) => (compare(s, max) > 0 ? s : max),
          [0, 0, 0] as Specificity,
        );
        total = add(total, widest);
      }
      i = close + 1;
    } else if (rest.startsWith("[")) {
      total = add(total, [0, 1, 0]);
      i += rest.indexOf("]") + 1;
    } else if (rest.startsWith("::")) {
      total = add(total, [0, 0, 1]);
      i += 2 + (/^[a-z-]+/.exec(rest.slice(2))?.[0].length ?? 0);
    } else if (rest.startsWith(":")) {
      total = add(total, [0, 1, 0]);
      i += 1 + (/^[a-z-]+/.exec(rest.slice(1))?.[0].length ?? 0);
    } else if (rest.startsWith(".")) {
      total = add(total, [0, 1, 0]);
      i += 1 + (/^[\w-]+/.exec(rest.slice(1))?.[0].length ?? 0);
    } else if (rest.startsWith("#")) {
      total = add(total, [1, 0, 0]);
      i += 1 + (/^[\w-]+/.exec(rest.slice(1))?.[0].length ?? 0);
    } else if (/^[a-z]/i.test(rest)) {
      total = add(total, [0, 0, 1]);
      i += /^[\w-]+/.exec(rest)?.[0].length ?? 1;
    } else {
      i += 1;
    }
  }
  return total;
}

/** `(prefers-contrast: more)` style conditions are true only when listed in `active`. */
function mediaApplies(params: string, active: readonly string[]): boolean {
  const query = params.trim();
  const negated = query.startsWith("not ");
  const condition = (negated ? query.slice(4) : query).trim();
  const known = /^\(([a-z-]+: [\w.-]+)\)$/.exec(condition);
  if (!known?.[1]) return false;
  return active.includes(known[1]) !== negated;
}

type Entry = {
  selector: string;
  specificity: Specificity;
  order: number;
  declarations: ReadonlyMap<string, string>;
};

function collect(active: readonly string[]): Entry[] {
  const entries: Entry[] = [];
  const visit = (nodes: ChildNode[]) => {
    for (const node of nodes) {
      if (node.type === "atrule") {
        const at: AtRule = node;
        if (
          at.name === "media" &&
          mediaApplies(at.params, active) &&
          at.nodes
        ) {
          visit(at.nodes);
        }
      } else if (node.type === "rule") {
        const rule: Rule = node;
        const declarations = new Map<string, string>();
        rule.walkDecls((decl) => declarations.set(decl.prop, decl.value));
        for (const selector of splitTopLevel(
          rule.selector.replace(/\s+/g, " "),
        )) {
          if (selector.includes("::")) continue;
          entries.push({
            selector,
            specificity: specificity(selector),
            order: entries.length,
            declarations,
          });
        }
      }
    }
  };
  visit(parse(glassCss).nodes);
  return entries;
}

/** The winning value of each property on `element`, given the active media features. */
export function resolveStyle(
  element: Element,
  active: readonly string[] = [],
): Map<string, string> {
  const winners = new Map<string, Entry>();
  for (const entry of collect(active)) {
    let matches = false;
    try {
      matches = element.matches(entry.selector);
    } catch {
      matches = false;
    }
    if (!matches) continue;
    for (const prop of entry.declarations.keys()) {
      const current = winners.get(prop);
      if (
        !current ||
        compare(entry.specificity, current.specificity) > 0 ||
        (compare(entry.specificity, current.specificity) === 0 &&
          entry.order > current.order)
      ) {
        winners.set(prop, entry);
      }
    }
  }
  const resolved = new Map<string, string>();
  for (const [prop, entry] of winners) {
    const value = entry.declarations.get(prop);
    if (value !== undefined) resolved.set(prop, value);
  }
  return resolved;
}
