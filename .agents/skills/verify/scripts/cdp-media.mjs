#!/usr/bin/env node
// Capture a page under media emulation the T3 browser tools cannot set (forced-colors).
// Usage: node cdp-media.mjs <origin> <path> <width> <height> <light|dark> <forced|none> <out.png> [email password]
// Starts its own throwaway headless Chrome (random port, temp profile) and closes it.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [origin, path, w, h, scheme, forced, out, email, password] = process.argv.slice(2);
const chromeBin =
  process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 400);
const dir = mkdtempSync(join(tmpdir(), "verify-cdp-"));
const chrome = spawn(
  chromeBin,
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    pending.get(d.id)?.(d.result);
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      pending.set(++id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  if (email) {
    const res = await fetch(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    });
    for (const c of res.headers.getSetCookie()) {
      const [nv, ...attrs] = c.split("; ");
      const [name, ...v] = nv.split("=");
      await send("Network.setCookie", { name, value: v.join("="), url: origin, path: "/" });
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 500 });
  await send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: scheme },
      { name: "forced-colors", value: forced === "forced" ? "active" : "none" },
    ],
  });
  await send("Page.navigate", { url: origin + path });
  await sleep(6000);
  const probe = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `({forced:matchMedia('(forced-colors: active)').matches,dark:matchMedia('(prefers-color-scheme: dark)').matches,iw:innerWidth,over:document.documentElement.scrollWidth-innerWidth,h1:document.querySelectorAll('h1').length,bodyColor:getComputedStyle(document.body).color,bodyBg:getComputedStyle(document.body).backgroundColor})`,
  });
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log(JSON.stringify(probe.result.value));
  ws.close();
} finally {
  chrome.kill();
  await new Promise((r) => (chrome.exitCode === null ? chrome.once("exit", r) : r()));
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
