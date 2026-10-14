// Liquid Glass for the Infinitunes mockup. Classic script, no modules, works over file://.
// Part 1 is pure (no DOM): the displacement and specular map generators, portable to TypeScript unchanged.
// Part 2 is the DOM layer: capability check, surface tagging, per-size SVG filters, pointer light,
// press feedback, selection lens (tab bar, segmented controls), tab bar minimize, artwork sampling, settings.
(function () {
  "use strict";

  /* =========================== Part 1: pure map generators =========================== */

  // Signed distance from point (x, y) to a rounded rect of size w x h with corner radius r (negative inside).
  // Also returns the outward unit normal of the nearest edge.
  function roundedRectSDF(x, y, w, h, r) {
    const px = x - w / 2, py = y - h / 2;
    const qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
    const sx = px < 0 ? -1 : 1, sy = py < 0 ? -1 : 1;
    if (qx > 0 && qy > 0) {
      const l = Math.hypot(qx, qy);
      return { d: l - r, nx: (qx / l) * sx, ny: (qy / l) * sy };
    }
    const d = Math.max(qx, qy) - r + Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
    return qx > qy ? { d, nx: sx, ny: 0 } : { d, nx: 0, ny: sy };
  }

  // Convex squircle bezel: height rises from 0 at the rim to 1 at the inner edge of the bezel (t in 0..1).
  const bezelHeight = (t) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);
  // dh/dt by central difference; the glass is as tall as the bezel is wide, so this is also the surface slope.
  const bezelSlope = (t) => {
    const e = 1e-3, a = Math.max(0, t - e), b = Math.min(1, t + e);
    return (bezelHeight(b) - bezelHeight(a)) / (b - a);
  };

  // Lateral ray displacement (in units of the bezel width) at normalised bezel position t, by Snell's law.
  // A vertical ray hits a surface tilted by theta1 = atan(slope), refracts to theta2 = asin(sin(theta1) / ior),
  // and travels through glass of height h(t) + thickness before reaching the backdrop plane.
  function refractionAt(t, ior, thickness) {
    const theta1 = Math.atan(bezelSlope(t));
    const theta2 = Math.asin(Math.sin(theta1) / ior);
    return (bezelHeight(t) + thickness) * Math.tan(theta1 - theta2);
  }

  // Displacement map. Output RGBA (Uint8ClampedArray, width*height*4): R and G encode the sample offset
  // in x and y (128 = none, 255 = +1, 1 = -1, relative to the filter scale), B = 128, A = 255.
  // Offsets point inward so edge pixels pull backdrop from inside the shape (never outside the border box).
  // magnify (0..1) adds a centre-ward pull across the whole surface: a magnifying droplet.
  function createDisplacementMap({ width, height, radius, bezel, ior = 1.5, thickness = 0.35, magnify = 0 }) {
    const w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    const r = Math.min(radius, w / 2, h / 2), b = Math.max(1, Math.min(bezel, r || bezel, w / 2, h / 2));
    // Precompute the 1D refraction profile over the bezel and normalise it to a peak of 1.
    const N = 128, prof = new Float32Array(N + 1);
    let peak = 0;
    for (let i = 0; i <= N; i++) { prof[i] = refractionAt(i / N, ior, thickness); peak = Math.max(peak, prof[i]); }
    for (let i = 0; i <= N; i++) prof[i] /= peak || 1;
    const vx = new Float32Array(w * h), vy = new Float32Array(w * h);
    const half = Math.min(w, h) / 2;
    let maxV = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = y * w + x, s = roundedRectSDF(x + 0.5, y + 0.5, w, h, r), inside = -s.d;
        let dx = 0, dy = 0;
        if (inside >= 0 && inside < b) {
          const m = prof[Math.round((inside / b) * N)];
          dx = -s.nx * m; dy = -s.ny * m; // inward
        }
        if (magnify && inside >= 0) {
          dx += ((w / 2 - x) / half) * magnify; dy += ((h / 2 - y) / half) * magnify;
        }
        vx[k] = dx; vy[k] = dy;
        maxV = Math.max(maxV, Math.abs(dx), Math.abs(dy));
      }
    }
    const data = new Uint8ClampedArray(w * h * 4), norm = maxV > 1 ? 1 / maxV : 1;
    for (let k = 0; k < w * h; k++) {
      data[k * 4] = 128 + Math.round(vx[k] * norm * 127);
      data[k * 4 + 1] = 128 + Math.round(vy[k] * norm * 127);
      data[k * 4 + 2] = 128;
      data[k * 4 + 3] = 255;
    }
    return { data, width: w, height: h };
  }

  // Specular map: white with alpha = Blinn-Phong highlight of the bezel normal under a key light from the
  // top-left plus a weaker counter light from the bottom-right, plus an isotropic Fresnel rim.
  // lightAngle is the direction the key light comes from, in degrees (CSS convention, 0 = top, 315 = top-left).
  function createSpecularMap({ width, height, radius, bezel, lightAngle = 315, key = 0.9, counter = 0.45, fresnel = 0.35, shininess = 18 }) {
    const w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    const r = Math.min(radius, w / 2, h / 2), b = Math.max(1, Math.min(bezel, r || bezel, w / 2, h / 2));
    const a = (lightAngle * Math.PI) / 180;
    const lights = [[Math.sin(a), -Math.cos(a), key], [-Math.sin(a), Math.cos(a), counter]];
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4, s = roundedRectSDF(x + 0.5, y + 0.5, w, h, r), inside = -s.d;
        data[k] = data[k + 1] = data[k + 2] = 255;
        if (inside < 0 || inside >= b) { data[k + 3] = 0; continue; }
        const t = inside / b, slope = Math.min(6, bezelSlope(Math.max(t, 0.02)));
        // Surface normal tilts outward by the bezel slope.
        let nx = s.nx * slope, ny = s.ny * slope, nz = 1;
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        let v = fresnel * Math.pow(1 - nz, 3);
        for (const [lx, ly, strength] of lights) {
          // Light 40 degrees above the surface plane, half vector with the viewer at +z.
          const L = [lx * 0.77, ly * 0.77, 0.64], H = [L[0], L[1], L[2] + 1], hl = Math.hypot(H[0], H[1], H[2]);
          const ndh = Math.max(0, (nx * H[0] + ny * H[1] + nz * H[2]) / hl);
          v += strength * Math.pow(ndh, shininess) * (1 - nz) * 2;
        }
        data[k + 3] = Math.round(Math.min(1, v) * 255);
      }
    }
    return { data, width: w, height: h };
  }

  /* =========================== Part 2: DOM layer =========================== */

  const doc = document, root = doc.documentElement;
  const SVGNS = "http://www.w3.org/2000/svg";

  // Surface registry: which mockup element is which glass surface. In the app, components set these attributes.
  // size: s (controls), m (player, toasts, captions), l (menus, dialogs, sheets), xl (full-height panes, no lens).
  const SURFACES = [
    [".player", "regular", "m", true],
    ["#tabbar", "regular", "s", true],
    [".bar .searchbox", "regular", "s", true],
    [".bar .nav-arrows", "regular", "s", true],
    [".bar .tb-group", "regular", "s", true],
    [".bar .back", "regular", "s", true],
    [".bar .btn.pri", "tinted", "s", true],
    [".menu", "regular", "l", true],
    [".dialog", "regular", "l", true],
    [".palette", "regular", "l", true],
    [".toast", "regular", "m", true],
    [".hero .cap", "clear", "m", true],
    [".preview .glass", "regular", "m", true],
    [".lg-demo [data-demo]", "regular", "m", true],
    [".np-top .ib", "clear", "s", true],
    [".np .pl-ctl .big", "tinted", "s", true],
    [".qpane", "regular", "l", true],
    [".side", "regular", "xl", false],
  ];
  const SEL = SURFACES.map((s) => s[0]).join(",");
  const PRESS_SEL = "[data-glass] button, [data-glass] a, [data-glass] .mi, [data-glass] [role=button], button[data-glass], a[data-glass]";

  // User-adjustable parameters. Defaults equal the "liquid" preset; light and dark differ only in tint.
  const PRESETS = {
    liquid: { tint: null, blur: 3, refraction: 30, sat: 1.8, spec: 1, shadow: 1, variant: "regular", accentTint: false, ambient: true, ambientLevel: 0.62 },
    subtle: { tint: 0.62, blur: 8, refraction: 8, sat: 1.4, spec: 0.6, shadow: 0.8, variant: "regular", accentTint: false, ambient: true, ambientLevel: 0.4 },
  };
  const DEFAULT_TINT = { light: 0.14, dark: 0.24 };
  const KEYS = ["tint", "blur", "refraction", "sat", "spec", "shadow", "variant", "accentTint", "ambientLevel"];
  const prefs = () => (typeof S !== "undefined" ? S.prefs : { glass: "liquid" });
  const isDark = () => root.classList.contains("dark");
  function cfg() {
    const p = prefs(), base = PRESETS[p.glass === "subtle" ? "subtle" : "liquid"], c = { ...base, ...(p.lg || {}) };
    if (c.tint == null) c.tint = DEFAULT_TINT[isDark() ? "dark" : "light"];
    return c;
  }
  const reduced = () => root.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reducedTransparency = () => matchMedia("(prefers-reduced-transparency: reduce)").matches || matchMedia("(prefers-contrast: more)").matches;

  /* ---------- Capability check ---------- */
  // Refraction needs SVG filters inside backdrop-filter. Safari and Firefox parse url() there but do not render it,
  // so a syntax check alone is not enough: require the syntax, the SVG primitives, and a Chromium engine signal
  // (navigator.userAgentData brands, an API only Chromium ships) as the tiebreaker. ?lens=0|1 overrides for testing.
  function lensCapable() {
    const q = new URLSearchParams(location.search).get("lens");
    if (q === "0") return false;
    const syntax = !!(window.CSS && CSS.supports("backdrop-filter", "url(#lg) blur(1px)"));
    const prims = "SVGFEDisplacementMapElement" in window && "SVGFEImageElement" in window;
    if (q === "1") return syntax && prims;
    const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
    const chromium = brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
    return syntax && prims && chromium;
  }
  let LENS = false;

  /* ---------- Filter cache ---------- */
  let defs = null;
  const filters = new Map(); // key -> { id, disp: feDisplacementMap, strength }
  let filterSeq = 0;
  const canvas = doc.createElement("canvas");
  function toDataURL(map) {
    canvas.width = map.width; canvas.height = map.height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(new ImageData(map.data, map.width, map.height), 0, 0);
    return canvas.toDataURL("image/png");
  }
  const STRENGTH = { s: 1, m: 0.75, l: 0.45 };
  const bezelFor = (w, h, r, size) => Math.round(Math.min(r, Math.max(8, Math.min(w, h) * (size === "s" ? 0.32 : 0.22)), size === "l" ? 22 : 18));
  function filterFor(w, h, r, size, magnify) {
    const bezel = bezelFor(w, h, r, size), key = `${w}x${h}r${r}b${bezel}${size}${magnify ? "m" : ""}`;
    let f = filters.get(key);
    if (f) return f;
    if (filters.size >= 24) gcFilters();
    const id = "lg-" + filterSeq++;
    const disp = toDataURL(createDisplacementMap({ width: w, height: h, radius: r, bezel, magnify: magnify ? 0.12 : 0 }));
    const spec = toDataURL(createSpecularMap({ width: w, height: h, radius: r, bezel }));
    const el = doc.createElementNS(SVGNS, "filter");
    el.setAttribute("id", id);
    for (const [k, v] of Object.entries({ x: 0, y: 0, width: w, height: h, filterUnits: "userSpaceOnUse", primitiveUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" })) el.setAttribute(k, v);
    el.innerHTML = `<feImage href="${disp}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="refr"/>
      <feImage href="${spec}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="spec"/>
      <feComponentTransfer in="spec" result="specA"><feFuncA type="linear" slope="1"/></feComponentTransfer>
      <feBlend in="specA" in2="refr" mode="screen"/>`;
    defs.appendChild(el);
    f = { id, disp: el.querySelector("feDisplacementMap"), specA: el.querySelector("feFuncA"), strength: (STRENGTH[size] || 1) * (magnify ? 0.7 : 1) };
    filters.set(key, f);
    setScale(f, 1);
    return f;
  }
  // Drop cached filters no connected surface references (toasts of many widths, window resizes).
  function gcFilters() {
    const live = new Set([...tracked].filter((el) => el.isConnected && el._lg).map((el) => el._lg.f.id));
    filters.forEach((f, k) => { if (!live.has(f.id)) { f.disp.closest("filter").remove(); filters.delete(k); } });
  }
  // Scale is static except during materialize (0..1 progress); never touched per pointer frame.
  function setScale(f, k) {
    const c = cfg();
    f.disp.setAttribute("scale", (2 * c.refraction * f.strength * k).toFixed(1));
    f.specA.setAttribute("slope", Math.min(1.5, c.spec * 0.8).toFixed(2));
  }
  const updateAllScales = () => filters.forEach((f) => setScale(f, 1));

  /* ---------- Surfaces ---------- */
  const tracked = new Set();
  const ro = "ResizeObserver" in window ? new ResizeObserver((entries) => entries.forEach((e) => scheduleLens(e.target))) : null;
  const pendingLens = new Map();
  function radiusOf(el, w, h) {
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    return Math.min(r, w / 2, h / 2);
  }
  function applyLens(el) {
    pendingLens.delete(el);
    if (!el.isConnected) { tracked.delete(el); return; }
    const want = LENS && el.dataset.lens !== "off" && el.dataset.glassSize !== "xl";
    if (!want) { el.style.removeProperty("--g-lens-url"); el._lg = null; return; }
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (w < 8 || h < 8 || w * h > 900 * 700) { el.style.removeProperty("--g-lens-url"); el._lg = null; return; }
    const f = filterFor(w, h, Math.round(radiusOf(el, w, h)), el.dataset.glassSize || "m", el.classList.contains("lg-sel"));
    el._lg = { f, w, h };
    el.style.setProperty("--g-lens-url", `url(#${f.id})`);
  }
  // Sizes change during layout transitions: drop the lens at once (a stale map would shear the backdrop),
  // and restore it 140 ms after the size settles.
  function scheduleLens(el) {
    const cur = el._lg;
    if (cur && (Math.abs(cur.w - el.offsetWidth) > 1 || Math.abs(cur.h - el.offsetHeight) > 1)) el.style.removeProperty("--g-lens-url");
    clearTimeout(pendingLens.get(el));
    pendingLens.set(el, setTimeout(() => applyLens(el), cur ? 140 : 0));
  }
  function tag(el) {
    const s = SURFACES.find(([sel]) => el.matches(sel));
    if (!s) return;
    if (!el.dataset.glass) el.dataset.glass = s[1];
    if (!el.dataset.glassSize) el.dataset.glassSize = s[2];
    if (!s[3]) el.dataset.lens = "off";
    if (!tracked.has(el)) { tracked.add(el); ro ? ro.observe(el) : applyLens(el); materialize(el); }
    if (el.dataset.glass === "clear") sampleBehind(el);
  }

  // Materialize: lens strength, blur, scale and opacity arrive together (CSS animates the rest).
  function materialize(el) {
    if (!el.matches(".menu,.dialog,.palette,.toast") || reduced()) return;
    let t0 = null, waited = 0;
    const step = (t) => {
      if (!el.isConnected) return;
      if (!el._lg) { if (++waited < 10) requestAnimationFrame(step); return; }
      t0 = t0 ?? t;
      const k = Math.min(1, (t - t0) / 320), e = 1 - Math.pow(1 - k, 3);
      setScale(el._lg.f, e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Selection lens: tab bar and segmented controls ---------- */
  const selState = new Map();
  const keyOf = (host) => host.id || host.getAttribute("aria-label") || [...host.children].map((c) => c.dataset.act || c.dataset.go || "").join("|");
  function enhanceSelector(host) {
    const items = [...host.children].filter((c) => c.matches("a,button"));
    let ind = host.querySelector(":scope > .lg-sel");
    if (!ind) {
      ind = doc.createElement("span"); ind.className = "lg-sel"; ind.setAttribute("aria-hidden", "true");
      ind.dataset.glassSize = "s";
      host.prepend(ind);
    }
    const on = items.find((i) => i.classList.contains("on"));
    if (!on) { ind.style.opacity = "0"; return; }
    ind.style.opacity = "";
    const target = { x: on.offsetLeft, w: on.offsetWidth, y: on.offsetTop, h: on.offsetHeight };
    const key = keyOf(host), prev = selState.get(key);
    selState.set(key, target);
    Object.assign(ind.style, { top: target.y + "px", height: target.h + "px" });
    if (ind._drag) return;
    if (prev && Math.abs(prev.x - target.x) > 1 && !reduced() && typeof spring === "function") {
      const from = ind._x ?? prev.x, fw = ind._w ?? prev.w;
      ind._stop && ind._stop();
      ind._stop = spring({ from: 0, to: 1, response: 0.38, damping: 0.82, onUpdate: (k) => placeSel(ind, from + (target.x - from) * k, fw + (target.w - fw) * k) });
    } else placeSel(ind, target.x, target.w);
  }
  function placeSel(ind, x, w) {
    ind._x = x; ind._w = w;
    ind.style.width = w + "px";
    ind.style.transform = `translateX(${x}px)` + (ind.classList.contains("lifted") ? " scale(1.14)" : "");
  }
  function selectorDrag(e) {
    const host = e.target.closest("#tabbar,.seg");
    if (!host || e.button > 0) return;
    const ind = host.querySelector(":scope > .lg-sel");
    if (!ind) return;
    const items = [...host.children].filter((c) => c.matches("a,button"));
    const pressed = e.target.closest("a,button");
    const startX = e.clientX, x0 = ind._x ?? 0, hist = [[e.clientX, e.timeStamp]];
    let dragging = false;
    const lift = (on) => { ind.classList.toggle("lifted", on); if (on) scheduleLens(ind); placeSel(ind, ind._x ?? 0, ind._w ?? 0); };
    if (pressed && pressed.classList.contains("on")) lift(true);
    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < 8) return;
        dragging = true; ind._drag = true; ind._stop && ind._stop();
        try { host.setPointerCapture(e.pointerId); } catch {}
        lift(true);
      }
      const min = items[0].offsetLeft, max = items[items.length - 1].offsetLeft + items[items.length - 1].offsetWidth - (ind._w || 0);
      let x = x0 + dx;
      if (x < min) x = min - ((typeof rubber === "function" ? rubber(min - x, host.offsetWidth) : 0));
      if (x > max) x = max + ((typeof rubber === "function" ? rubber(x - max, host.offsetWidth) : 0));
      placeSel(ind, x, ind._w);
      hist.push([ev.clientX, ev.timeStamp]); if (hist.length > 5) hist.shift();
    };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerup", up); host.removeEventListener("pointercancel", up);
      if (!dragging) { setTimeout(() => lift(false), 180); return; }
      try { host.releasePointerCapture(e.pointerId); } catch {}
      const [a, b] = [hist[0], hist[hist.length - 1]];
      const vel = b[1] > a[1] ? ((b[0] - a[0]) / (b[1] - a[1])) * 1000 : 0;
      const proj = (ind._x ?? 0) + (ind._w || 0) / 2 + (typeof project === "function" ? project(vel, 0.99) : 0);
      const pick = items.reduce((best, it) => (Math.abs(it.offsetLeft + it.offsetWidth / 2 - proj) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - proj) ? it : best), items[0]);
      const from = ind._x, fw = ind._w, to = pick.offsetLeft, tw = pick.offsetWidth;
      ind._stop = spring({ from: 0, to: 1, velocity: to !== from ? vel / (to - from) : 0, response: 0.35, damping: 0.8,
        onUpdate: (k) => placeSel(ind, from + (to - from) * k, fw + (tw - fw) * k), onDone: () => { ind._drag = false; lift(false); } });
      selState.set(keyOf(host), { x: to, w: tw, y: pick.offsetTop, h: pick.offsetHeight });
      // The release would otherwise click whatever is under the pointer; commit the projected item instead.
      const swallow = (c) => { c.stopImmediatePropagation(); c.preventDefault(); };
      addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => removeEventListener("click", swallow, { capture: true }), 80);
      if (!pick.classList.contains("on")) {
        if (pick.dataset.go && typeof Router !== "undefined") Router.go(pick.dataset.go);
        else setTimeout(() => pick.click(), 90);
      }
    };
    host.addEventListener("pointermove", move); host.addEventListener("pointerup", up); host.addEventListener("pointercancel", up);
  }

  /* ---------- Press feedback: glow from the touch point, gel scale ---------- */
  function press(e) {
    const ctl = e.target.closest(PRESS_SEL);
    if (!ctl || e.button > 0) return;
    const host = ctl.closest("[data-glass]");
    if (!host) return;
    const r = host.getBoundingClientRect();
    host.style.setProperty("--g-px", e.clientX - r.left + "px");
    host.style.setProperty("--g-py", e.clientY - r.top + "px");
    const self = ctl === host; // the control is itself a glass surface: it gels
    const target = self ? host : ctl;
    const grow = Math.min(0.08, 6 / Math.max(1, target.offsetWidth)); // at most 6px wider: full-width rows must not overflow
    const anim = (to, damping) => {
      if (reduced() || typeof spring !== "function") { host.style.setProperty("--g-press", to); return; }
      host._pstop && host._pstop();
      host._pstop = spring({ from: host._p || 0, to, response: 0.3, damping, onUpdate: (v) => {
        host._p = v; host.style.setProperty("--g-press", v.toFixed(3));
        if (target.matches(".lg-sel") || target.closest(".seg,#tabbar") === host) return;
        target.style.scale = self ? `${1 + Math.min(0.06, grow) * v} ${1 + Math.min(0.04, grow) * v}` : `${1 + grow * v}`;
      } });
    };
    anim(1, 1);
    const up = () => { removeEventListener("pointerup", up); removeEventListener("pointercancel", up); anim(0, self ? 0.55 : 0.75); };
    addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }

  /* ---------- Pointer and device light ---------- */
  let pointer = null, lightRaf = 0;
  function updateLight() {
    lightRaf = 0;
    if (!pointer) return;
    tracked.forEach((el) => {
      if (!el.isConnected || el.dataset.glassSize === "xl") return;
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const nx = Math.max(r.left, Math.min(pointer.x, r.right)), ny = Math.max(r.top, Math.min(pointer.y, r.bottom));
      const dist = Math.hypot(pointer.x - nx, pointer.y - ny);
      if (dist > 320) { if (el._lit) { el.style.removeProperty("--g-light"); el._lit = false; } return; }
      // The highlight gradient starts on the side facing the pointer; blend toward the default top-left light with distance.
      const ang = (Math.atan2(cx - pointer.x, -(cy - pointer.y)) * 180) / Math.PI;
      const w = 1 - dist / 320, def = 135;
      let d = ((ang - def + 540) % 360) - 180;
      el.style.setProperty("--g-light", (def + d * w).toFixed(1) + "deg");
      el._lit = true;
    });
  }
  function onPointer(e) {
    if (e.pointerType !== "mouse") return;
    pointer = { x: e.clientX, y: e.clientY };
    if (!lightRaf) lightRaf = requestAnimationFrame(updateLight);
  }
  function onOrientation(e) {
    if (e.gamma == null) return;
    root.style.setProperty("--g-light", (135 + Math.max(-40, Math.min(40, e.gamma)) * 1.2).toFixed(1) + "deg");
  }

  /* ---------- Adaptive tint from the playing artwork (8x8 sample) ---------- */
  const sampleCanvas = doc.createElement("canvas"); sampleCanvas.width = sampleCanvas.height = 8;
  const samples = new Map();
  function sample(url, cb) {
    if (!url) return;
    if (samples.has(url)) return cb(samples.get(url));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 8, 8);
        const d = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, l = 0;
        const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const cols = [];
        for (let i = 0; i < 256; i += 4) {
          r += d[i]; g += d[i + 1]; b += d[i + 2];
          l += 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
          cols.push([d[i], d[i + 1], d[i + 2]]);
        }
        // Three most saturated cells (one per row band) seed the ambient colour field.
        const sat = (c) => Math.max(...c) - Math.min(...c);
        const band = (from, to) => cols.slice(from * 8, to * 8).sort((a, b2) => sat(b2) - sat(a))[0];
        const res = { avg: [r / 64, g / 64, b / 64].map(Math.round), l: l / 64, blobs: vividSet([band(0, 3), band(3, 5), band(5, 8)]) };
        samples.set(url, res); cb(res);
      } catch { /* tainted canvas: keep the neutral defaults */ }
    };
    img.src = url;
  }
  // Sampled colours become vivid swatches (HSL saturation >= 0.7, lightness 0.5 to 0.62) so the field glows.
  // When all three land within 40 degrees of hue (warm covers do), blobs 2 and 3 rotate by -60 and +60 degrees.
  function toHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let hue = 0;
    if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(hue * 60 + 360) % 360, d < 0.04 ? 0 : d / (1 - Math.abs(mx + mn - 1)), (mx + mn) / 2];
  }
  function fromHsl([hue, sat, l]) {
    const c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs(((hue / 60) % 2) - 1)), m = l - c / 2;
    const [a, bb, cc] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
    return [a, bb, cc].map((v) => Math.round((v + m) * 255));
  }
  function vividSet(cols) {
    const hsl = cols.map(toHsl).map(([h, s2, l]) => [h, Math.max(0.7, s2), Math.min(0.62, Math.max(0.5, l))]);
    const dist = (a, b2) => Math.min(Math.abs(a - b2), 360 - Math.abs(a - b2));
    const spread = Math.max(dist(hsl[0][0], hsl[1][0]), dist(hsl[0][0], hsl[2][0]), dist(hsl[1][0], hsl[2][0]));
    if (spread < 40) { hsl[1][0] = (hsl[0][0] + 300) % 360; hsl[2][0] = (hsl[0][0] + 60) % 360; }
    return hsl.map(fromHsl);
  }
  let lastArt = "";
  function sampleArtwork() {
    const img = doc.querySelector("#ambient img");
    const url = img && img.currentSrc ? img.currentSrc : img && img.src;
    if (!url || url === lastArt) return;
    lastArt = url;
    sample(url, (s) => {
      root.style.setProperty("--g-art-l", s.l.toFixed(3));
      root.style.setProperty("--g-art", `rgb(${s.avg.join(" ")})`);
      s.blobs.forEach((c, i) => root.style.setProperty(`--g-blob-${i + 1}`, `rgb(${c.join(" ")})`));
    });
  }
  function sampleBehind(el) {
    const img = el.parentElement && el.parentElement.querySelector(":scope > img");
    if (img) sample(img.currentSrc || img.src, (s) => el.style.setProperty("--g-art-l", s.l.toFixed(3)));
  }

  /* ---------- Tab bar minimize on scroll ---------- */
  let lastY = 0, acc = 0;
  function onScroll() {
    const y = scrollY, dy = y - lastY; lastY = y;
    if (innerWidth >= 768) return root.classList.remove("tab-min");
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 40 || acc < -24) root.classList.remove("tab-min");
    else if (acc > 48) root.classList.add("tab-min");
  }

  /* ---------- Settings: Liquid Glass panel ---------- */
  const SLIDERS = [
    ["tint", "Transparency", 0.1, 1, 0.01, (v) => Math.round(v * 100) + "%", true], // slider shows 1 - tint alpha
    ["blur", "Blur", 0, 20, 0.5, (v) => v + "px"],
    ["refraction", "Refraction", 0, 48, 1, (v) => v + "px"],
    ["sat", "Saturation", 1, 2.6, 0.05, (v) => Math.round(v * 100) + "%"],
    ["spec", "Edge highlight", 0, 1.6, 0.05, (v) => Math.round(v * 100) + "%"],
    ["shadow", "Shadow", 0, 1.6, 0.05, (v) => Math.round(v * 100) + "%"],
    ["ambientLevel", "Ambient intensity", 0, 1, 0.01, (v) => Math.round(v * 100) + "%"],
  ];
  function settingsPanel() {
    const c = cfg(), p = prefs();
    const seg = (k, opts) => `<div class="seg" role="group" aria-label="${k}">${opts.map(([v, l]) => `<button class="${c[k] === v ? "on" : ""}" data-lg="${k}" data-v="${v}">${l}</button>`).join("")}</div>`;
    const sw = (on, k, label) => `<button class="switch${on ? " on" : ""}" data-lg="${k}" role="switch" aria-checked="${on}" aria-label="${label}"></button>`;
    return `<div class="lg-panel${p.glass === "off" ? " off" : ""}"><h3 class="t-sub">Liquid Glass</h3>
      <div class="lg-demo" aria-label="Liquid Glass preview">
        <i class="b1"></i><i class="b2"></i><i class="b3"></i><span class="lg-demo-txt">Liquid<br>Glass</span>
        <div data-demo data-glass="${c.variant}" class="lg-demo-card"><b>Now Playing</b><small>Glass over a colourful backdrop</small></div>
        <button data-demo data-glass="${c.variant}" class="lg-demo-dot" aria-label="Preview button">${typeof icon === "function" ? icon("play") : ""}</button>
        <div data-demo data-glass="${c.variant}" class="lg-demo-pill"><span>Regular</span><span>Clear</span></div>
      </div>
      <div class="srow lg-variant"><div class="lbl"><b>Variant</b><small>Applies to the player, tab bar and toolbar. Menus, dialogs and the sidebar stay Regular for legibility.</small></div>${seg("variant", [["regular", "Regular"], ["clear", "Clear"], ["tinted", "Tinted"]])}</div>
      ${SLIDERS.map(([k, l, min, max, step, fmt, invert]) => `<div class="range-row lg-range"><label for="lg-${k}">${l}</label><input id="lg-${k}" type="range" min="${min}" max="${max}" step="${step}" value="${invert ? +(1 - c[k]).toFixed(2) : c[k]}" data-lg="${k}"${invert ? ' data-invert="1"' : ""}><output>${fmt(invert ? 1 - c[k] : +c[k])}</output></div>`).join("")}
      <div class="srow"><div class="lbl"><b>Tint follows accent</b><small>Mix the accent colour into the glass tint.</small></div>${sw(c.accentTint, "accentTint", "Tint follows accent")}</div>
      <div class="srow"><div class="lbl"><b>Ambient background</b><small>A colour field from the playing artwork that the glass refracts.</small></div>${sw(p.ambient, "ambient", "Ambient background")}</div>
      <div class="srow"><div class="lbl"><b>Refraction engine</b><small>${LENS ? "SVG lens (Chromium)." : "Frosted fallback: this browser cannot refract a backdrop."}</small></div><button class="btn sq" data-lg="reset">Reset glass</button></div>
    </div>`;
  }
  function save() {
    if (typeof S === "undefined") return;
    try { localStorage.setItem("inf-prefs", JSON.stringify(S.prefs)); } catch {}
  }
  function setCfg(k, v) {
    const p = prefs();
    p.lg = { ...(p.lg || {}), [k]: v };
    apply(); save();
  }
  function bind(scope = doc) {
    if (scope._lgBound) return;
    scope._lgBound = true;
    scope.addEventListener("input", (e) => {
      const el = e.target.closest("input[data-lg]");
      if (!el) return;
      const k = el.dataset.lg, v = +el.value, s = SLIDERS.find((x) => x[0] === k);
      el.nextElementSibling.textContent = s[5](v);
      setCfg(k, s[6] ? +(1 - v).toFixed(2) : v);
    });
    scope.addEventListener("click", (e) => {
      const el = e.target.closest("button[data-lg]");
      if (!el) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const k = el.dataset.lg, p = prefs();
      if (k === "reset") { delete p.lg; p.ambient = true; apply(); save(); if (typeof refresh === "function") refresh(); return; }
      if (k === "ambient") { p.ambient = !p.ambient; root.classList.toggle("no-ambient", !p.ambient); el.classList.toggle("on", p.ambient); save(); return; }
      if (k === "accentTint") { const on = !cfg().accentTint; el.classList.toggle("on", on); el.setAttribute("aria-checked", on); return setCfg(k, on); }
      if (k === "variant") {
        el.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === el));
        doc.querySelectorAll(".lg-demo [data-demo]").forEach((d) => (d.dataset.glass = el.dataset.v));
        return setCfg(k, el.dataset.v);
      }
    }, true);
  }

  /* ---------- Apply CSS variables ---------- */
  function apply() {
    const c = cfg(), p = prefs(), st = root.style;
    st.setProperty("--glass-tint", c.tint);
    st.setProperty("--glass-blur", c.blur + "px");
    st.setProperty("--glass-refraction", c.refraction);
    st.setProperty("--glass-sat", c.sat);
    st.setProperty("--glass-spec", c.spec);
    st.setProperty("--glass-shadow", c.shadow);
    st.setProperty("--ambient", c.ambientLevel);
    root.classList.toggle("lg-accent-tint", !!c.accentTint);
    root.classList.toggle("lg-v-clear", c.variant === "clear");
    root.classList.toggle("lg-v-tinted", c.variant === "tinted");
    root.classList.toggle("lg-lens", LENS && p.glass !== "off" && !reducedTransparency());
    updateAllScales();
  }

  /* ---------- Scan ---------- */
  let scanRaf = 0;
  function scan() {
    scanRaf = 0;
    doc.querySelectorAll(SEL).forEach(tag);
    doc.querySelectorAll("#tabbar, .seg").forEach(enhanceSelector);
    doc.querySelectorAll(".lg-sel").forEach((ind) => { if (!tracked.has(ind)) { tracked.add(ind); ro && ro.observe(ind); } });
    const bar = doc.getElementById("bar");
    if (bar) bar.classList.toggle("lg-over-art", !!doc.querySelector("#view .dhead"));
    sampleArtwork();
  }
  const queueScan = () => { if (!scanRaf) scanRaf = requestAnimationFrame(scan); };

  function init() {
    if (init.done) return;
    init.done = true;
    LENS = lensCapable();
    root.classList.toggle("lg-capable", LENS);
    defs = doc.querySelector("#lg-defs defs");
    if (!defs) {
      const svg = doc.createElementNS(SVGNS, "svg");
      svg.id = "lg-defs"; svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
      svg.style.position = "absolute";
      defs = doc.createElementNS(SVGNS, "defs"); svg.appendChild(defs); doc.body.appendChild(svg);
    }
    apply(); scan(); bind();
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "childList" ? [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1) : m.target.closest && m.target.closest(".seg,#tabbar")) return queueScan();
      }
    }).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "src"] });
    addEventListener("pointerdown", (e) => { selectorDrag(e); press(e); }, { passive: true });
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    // Tapping the minimized tab bar expands it instead of re-navigating to the current tab.
    addEventListener("click", (e) => {
      if (!root.classList.contains("tab-min") || !e.target.closest("#tabbar")) return;
      e.preventDefault(); e.stopImmediatePropagation(); acc = 0; root.classList.remove("tab-min");
    }, true);
    addEventListener("deviceorientation", onOrientation, { passive: true });
    addEventListener("resize", queueScan, { passive: true });
    matchMedia("(prefers-reduced-transparency: reduce)").addEventListener("change", apply);
    matchMedia("(prefers-contrast: more)").addEventListener("change", apply);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else setTimeout(init);

  window.Glass = {
    init, refresh: () => { apply(); scan(); }, apply, settingsPanel, bind,
    createDisplacementMap, createSpecularMap, roundedRectSDF, refractionAt,
    get lens() { return LENS; }, config: cfg,
  };
})();
