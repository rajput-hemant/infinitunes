/**
 * Inline bootstrap that runs before first paint, so the root layout never
 * reads request data and stays static. It applies, from browser state only:
 *
 * - `COLOR_SCHEME_STEP`: the light/dark class and `color-scheme` on `<html>`
 *   (what `next-themes` would set; `components/provider.tsx` mutes its own copy
 *   of this script so this one is the only inline script CSP has to allow), and
 * - `APPEARANCE_STEP`: the saved appearance. The `theme-config` cookie carries a
 *   precomputed `html` field (`{ a: attributes, s: variables }`, written by
 *   `lib/theme/cookie.ts` from `themeConfigToHtml`), so the accent derivation
 *   never has to be duplicated here. Names and values are pattern-checked
 *   before they touch `<html>`; anything malformed is ignored.
 *
 * - `QUEUE_STEP`: the docked queue's open flag. `components/player/use-queue-pane.ts` persists
 *   it in `localStorage` under `queue_open` (JSON, default open) and the shell
 *   reserves the pane's column from `data-queue="open"` at 1440px and up, so the
 *   attribute must exist before first paint or the content jumps once the
 *   client-only player mounts. The pane clears it again if the viewport is narrow.
 *
 * To run more state before paint, add another self-contained `try{...}catch(e){}`
 * step to `STEPS`. `lib/csp.ts` hashes the joined string, so the `script-src`
 * hash follows automatically. Steps must be plain ES5, share the `d` (`<html>`)
 * variable and never throw.
 */
const COLOR_SCHEME_STEP = `try{var t=localStorage.getItem("theme")||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="light"||t==="dark"){d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}}catch(e){}`;

const APPEARANCE_STEP = `try{var m=document.cookie.match(/(?:^|; )theme-config=([^;]*)/),c=m&&JSON.parse(decodeURIComponent(m[1])),h=c&&c.html;if(h&&typeof h==="object"){var a=h.a,s=h.s,k;if(a&&typeof a==="object")for(k in a)if(/^data-[a-z-]+$/.test(k)&&/^[a-z0-9-]+$/.test(a[k]))d.setAttribute(k,a[k]);if(s&&typeof s==="object")for(k in s)if(/^--[a-z-]+$/.test(k)&&/^(oklch\\([0-9 .%e-]+\\)|[0-9.e-]+(px|rem)?)$/.test(s[k]))d.style.setProperty(k,s[k])}}catch(e){}`;

const QUEUE_STEP = `try{if(localStorage.getItem("queue_open")!=="false")d.setAttribute("data-queue","open")}catch(e){}`;

const STEPS = [COLOR_SCHEME_STEP, APPEARANCE_STEP, QUEUE_STEP];

export const THEME_BOOTSTRAP_SCRIPT = `(function(){var d=document.documentElement;${STEPS.join("")}})()`;
