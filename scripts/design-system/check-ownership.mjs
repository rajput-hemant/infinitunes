#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { units } = JSON.parse(
  readFileSync(join(root, "docs/design-system/ownership.json"), "utf8"),
);

const escape = (ch) => ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

/** `**` matches any depth, `*` matches within one segment, everything else is literal. */
function toRegExp(pattern) {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      out += ".*";
      i++;
    } else if (ch === "*") {
      out += "[^/]*";
    } else {
      out += escape(ch);
    }
  }
  return new RegExp(`^${out}$`);
}

const matchers = Object.fromEntries(
  Object.entries(units).map(([id, patterns]) => [id, patterns.map(toRegExp)]),
);

const owners = (file) =>
  Object.keys(matchers).filter((id) => matchers[id].some((re) => re.test(file)));

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

function changedFiles(base) {
  const tracked = git("diff", "--name-only", base);
  const untracked = git("ls-files", "--others", "--exclude-standard");
  return [...new Set([...tracked, ...untracked])];
}

const [command, ...rest] = process.argv.slice(2);

if (command === "overlap") {
  const files = git("ls-files");
  const clashes = files
    .map((file) => [file, owners(file)])
    .filter(([, ids]) => ids.length > 1);
  for (const [file, ids] of clashes) console.error(`${file}: ${ids.join(", ")}`);
  if (clashes.length > 0) process.exit(1);
  console.log(`ok: no file is owned by two units (${files.length} tracked files)`);
} else if (command === "check") {
  const [unit, base = "HEAD"] = rest;
  if (!matchers[unit]) {
    console.error(`unknown unit "${unit}". units: ${Object.keys(matchers).join(", ")}`);
    process.exit(2);
  }
  const offenders = changedFiles(base).filter((file) => !owners(file).includes(unit));
  for (const file of offenders) {
    console.error(`outside unit "${unit}": ${file}`);
  }
  if (offenders.length > 0) process.exit(1);
  console.log(`ok: every change since ${base} is inside unit "${unit}"`);
} else {
  console.error(
    "usage: check-ownership.mjs overlap | check <unit> [base-ref]",
  );
  process.exit(2);
}
