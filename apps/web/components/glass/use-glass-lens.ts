"use client";

import { useEffect, type RefObject } from "react";

import { lensCapable } from "~/lib/glass/capabilities";
import {
  createDisplacementMap,
  createSpecularMap,
  toDataURL,
} from "~/lib/glass/engine";

const STRENGTH: Record<string, number> = { s: 1, m: 0.75, l: 0.45 };
let filterSeq = 1;

type LensFilter = {
  id: string;
  displacement: SVGFEDisplacementMapElement | null;
  strength: number;
};

const filters = new Map<string, LensFilter>();
const SVGNS = "http://www.w3.org/2000/svg";

function bezelFor(w: number, h: number, r: number, size: string) {
  return Math.round(
    Math.min(
      r,
      Math.max(8, Math.min(w, h) * (size === "s" ? 0.32 : 0.22)),
      size === "l" ? 22 : 18,
    ),
  );
}

function gcFilters() {
  const live = new Set<string>();
  document
    .querySelectorAll<HTMLElement>("[data-glass-lens]")
    .forEach((el) => {
      if (el.dataset.glassLens) live.add(el.dataset.glassLens);
    });
  for (const [key, filter] of filters) {
    if (!live.has(filter.id)) {
      filter.displacement?.closest("filter")?.remove();
      filters.delete(key);
    }
  }
}

function setScale(filter: LensFilter, k: number) {
  filter.displacement?.setAttribute("scale", String(filter.strength * k * 18));
}

function filterFor(
  w: number,
  h: number,
  r: number,
  size: string,
  magnify: boolean,
): LensFilter | null {
  const bezel = bezelFor(w, h, r, size);
  const key = `${w}x${h}r${r}b${bezel}${size}${magnify ? "m" : ""}`;
  const cached = filters.get(key);
  if (cached) return cached;

  if (filters.size >= 24) gcFilters();

  const id = "lg-" + filterSeq++;
  const dispMap = createDisplacementMap({
    width: w,
    height: h,
    radius: r,
    bezel,
    magnify: magnify ? 0.12 : 0,
  });
  const specMap = createSpecularMap({ width: w, height: h, radius: r, bezel });

  const disp = toDataURL(dispMap);
  const spec = toDataURL(specMap);

  const defs = document.querySelector("#lg-defs defs");
  if (!defs) return null;

  const el = document.createElementNS(SVGNS, "filter");
  el.setAttribute("id", id);
  for (const [k, v] of Object.entries({
    x: 0,
    y: 0,
    width: w,
    height: h,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  })) {
    el.setAttribute(k, String(v));
  }

  el.innerHTML = `<feImage href="${disp}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="refr"/>
    <feImage href="${spec}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="spec"/>
    <feComponentTransfer in="spec" result="specA"><feFuncA type="linear" slope="1"/></feComponentTransfer>
    <feBlend in="specA" in2="refr" mode="screen"/>`;

  defs.appendChild(el);
  const filter: LensFilter = {
    id,
    displacement: el.querySelector("feDisplacementMap"),
    strength: (STRENGTH[size] ?? 1) * (magnify ? 0.7 : 1),
  };
  filters.set(key, filter);
  setScale(filter, 1);
  return filter;
}

export type GlassLensOpts = {
  size?: "s" | "m" | "l" | "xl";
  magnify?: boolean;
  off?: boolean;
};

export function useGlassLens(
  ref: RefObject<HTMLElement | null>,
  opts: GlassLensOpts,
) {
  useEffect(() => {
    if (opts.off) return;

    if (!lensCapable()) return;
    const mediaRT = window.matchMedia("(prefers-reduced-transparency: reduce)");
    if (mediaRT.matches) return;
    const mediaCM = window.matchMedia("(prefers-contrast: more)");
    if (mediaCM.matches) return;

    const el = ref.current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    let currentId: string | null = null;
    let w0 = 0;
    let h0 = 0;

    const apply = () => {
      if (!el.isConnected) return;
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (w < 8 || h < 8 || w * h > 900 * 700) {
        el.style.removeProperty("--g-lens-url");
        el.removeAttribute("data-glass-lens");
        return;
      }
      const st = window.getComputedStyle(el);
      const r = parseFloat(st.borderTopLeftRadius) || 0;
      const radius = Math.min(r, w / 2, h / 2);

      const f = filterFor(
        w,
        h,
        Math.round(radius),
        opts.size || "m",
        !!opts.magnify,
      );
      if (!f) return;

      currentId = f.id;
      w0 = w;
      h0 = h;
      el.setAttribute("data-glass-lens", f.id);
      el.style.setProperty("--g-lens-url", `url(#${f.id})`);

      const mediaRM = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (
        !mediaRM.matches &&
        document.documentElement.classList.contains("lg-capable") &&
        !document.documentElement.classList.contains("reduce-motion")
      ) {
        let t0: number | null = null;
        const step = (t: number) => {
          if (!el.isConnected || el.getAttribute("data-glass-lens") !== f.id)
            return;
          t0 = t0 ?? t;
          const k = Math.min(1, (t - t0) / 320);
          const e = 1 - Math.pow(1 - k, 3);
          setScale(f, e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      } else {
        setScale(f, 1);
      }
    };

    const ro = new ResizeObserver(() => {
      if (w0 && h0) {
        if (
          Math.abs(w0 - el.offsetWidth) > 1 ||
          Math.abs(h0 - el.offsetHeight) > 1
        ) {
          el.style.removeProperty("--g-lens-url");
        }
      }
      clearTimeout(timeout);
      timeout = setTimeout(apply, currentId ? 140 : 0);
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timeout);
    };
  }, [opts.size, opts.magnify, opts.off, ref]);
}
