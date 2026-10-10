/**
 * Inline bootstrap that runs before first paint so the root layout never reads
 * request data. It applies two things from browser state:
 *
 * - the light/dark class and `color-scheme` on `<html>` (what `next-themes`
 *   would set; `components/provider.tsx` mutes its own copy of this script so
 *   this one is the only inline script CSP has to allow), and
 * - the `theme-config` cookie (see `lib/theme-config.ts`) as a `theme-*` class
 *   and `--radius` on `<body>`, where `styles/themes.css` expects them.
 *
 * `lib/csp.ts` hashes this exact string, so edit it freely: the `script-src`
 * hash follows. Malformed input is ignored, matching `parseThemeConfig`.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var d=document.documentElement,b=document.body;try{var t=localStorage.getItem("theme")||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="light"||t==="dark"){d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t}}catch(e){}try{var m=document.cookie.match(/(?:^|; )theme-config=([^;]*)/),c=m&&JSON.parse(decodeURIComponent(m[1]));if(c&&typeof c==="object"){if(typeof c.theme==="string"&&/^[a-z]+$/.test(c.theme)&&c.theme!=="default")b.classList.add("theme-"+c.theme);if([0,0.3,0.5,0.75,1].indexOf(c.radius)>-1)b.style.setProperty("--radius",c.radius+"rem")}}catch(e){}})()`;
