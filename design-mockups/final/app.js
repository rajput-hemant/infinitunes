// Infinitunes unified design mockup. Shared content lives in ../shared/data.js, routing in ../shared/router.js.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const src = (i, s = 150) => (!i ? "" : i.startsWith("http") ? i : MOCK.img(i, s));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const secs = (d) => { const [m, s] = String(d || "0:00").split(":").map(Number); return m * 60 + (s || 0); };
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const isMobile = () => innerWidth < 768;

/* ---------- Icons (Lucide-style, 24px grid) ---------- */
const P = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
  radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.1 19.1 19"/><circle cx="12" cy="12" r="2"/>',
  library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  listmusic: '<path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>',
  queue: '<path d="M3 6h18M3 12h12M3 18h9"/><path d="m17 15 4 3-4 3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  settings: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  prev: '<path d="M19 20 9 12l10-8zM5 19V5"/>',
  next: '<path d="m5 4 10 8-10 8zM19 5v14"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  repeat1: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3M11 10h1v4"/>',
  vol: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  download: '<path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  langs: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  rows: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  lyrics: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"/><path d="m9 12 2 2 4-4"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2A5.6 5.6 0 0 0 22 11c0-5-4.5-9-10-9z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  radius: '<path d="M20 4h-6a10 10 0 0 0-10 10v6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5-2.6-.5-5.4-.5-8 0C6 2 5 2 5 2c-.3 1.1-.3 2.3 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.8 1.6-.2.6-.3 1.2-.2 1.9v4"/><path d="M9 18c-4.5 2-5-2-7-2"/>',
  map: '<path d="M14.1 5.9 9.9 3.6a2 2 0 0 0-1.8 0L3.6 5.8a1 1 0 0 0-.6.9v13.7a1 1 0 0 0 1.4.9l3.7-1.8a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.2a1 1 0 0 0 .6-.9V4.8a1 1 0 0 0-1.4-.9l-3.7 1.8a2 2 0 0 1-1.8.1zM9 3.2v15M15 5.8v15"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  sort: '<path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
};
const icon = (n, cls = "") => `<svg class="${cls}${n === "play" || n === "pause" ? " solid" : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
const EQ = '<span class="eq"><i></i><i></i><i></i></span>';

/* ---------- Content ---------- */
const ALB = MOCK.albums[0];
const SONGS = MOCK.albumTracks.map(([t, a, d], k) => ({ id: "mj-" + k, t, a, d, i: ALB.img, al: ALB.title, alId: "michael", arId: a === "Michael Jackson" ? "michael-jackson" : "" }));
const NEW = MOCK.newReleases.map((s) => ({ id: s.id, t: s.title, a: s.subtitle, d: s.duration, i: s.img, al: s.title.replace(/ \(From.*$/, ""), alId: "", arId: "" }));
const ART_SONGS = MOCK.artistSongs.map(([t, a, d, i], k) => ({ id: "ss-" + k, t, a, d, i, al: "Dhurandhar The Revenge", alId: "dhurandhar", arId: "shashwat-sachdev" }));
const SHOW_IMG = "https://c.sop.saavncdn.com/Shri-Krishna-Amritvani-20211001160841-BG.jpg";
const SHOW = { id: "krishna-amritvani", title: "Shri Krishna Amritvani", subtitle: "Devotional", img: SHOW_IMG };
const EPS = MOCK.episodes.map(([t, s, d], k) => ({ id: "ep-" + (k + 1), t, a: SHOW.title, d, i: SHOW_IMG, al: s, alId: "", ep: true }));
const ALL = [...SONGS, ...NEW, ...ART_SONGS, ...EPS];
const byId = (id) => ALL.find((s) => s.id === id);
const ARTISTS = [...MOCK.artists, { id: "michael-jackson", name: "Michael Jackson", img: ALB.img, listeners: "41M" }];
const LABEL = { id: "jio-studios", name: "Jio Studios", img: MOCK.albums[1].img };
const MIX = { id: "arijit-singh-mix", title: "Arijit Singh Mix", subtitle: "Made for you", img: MOCK.playlists[2].img };
const STATIONS = MOCK.radio.map((n, k) => ({ id: slug(n), title: n, subtitle: "Radio station", img: [MOCK.playlists[1].img, MOCK.albums[1].img, MOCK.playlists[8].img, MOCK.albums[9].img, MOCK.albums[6].img, MOCK.playlists[6].img][k] }));
// Placeholder shows (only Shri Krishna Amritvani is real catalog data).
const SHOWS = [SHOW, ...["Bollywood Flashback", "Mythology Stories", "Cricket Daily", "Tech Talks India", "Mindful Minutes"].map((t, k) => ({ id: slug(t), title: t, subtitle: ["Entertainment", "Culture", "Sports", "Technology", "Health"][k], grad: k }))];
const GRADS = ["#f97316,#e11d48", "#7c3aed,#2563eb", "#16a34a,#0ea5e9", "#0f172a,#64748b", "#facc15,#f97316"];
const TILE_COLORS = ["#e11d48", "#7c3aed", "#0ea5e9", "#16a34a", "#f97316", "#0f172a", "#db2777", "#2563eb"];

/* ---------- State ---------- */
const DEF = { mode: "light", accent: "#e11d48", radius: 12, font: "system", head: "system", size: 16, density: "comfortable", glass: "liquid", ambient: true, motion: false };
let saved = {};
try { saved = JSON.parse(localStorage.getItem("inf-prefs") || "{}"); } catch {}
const S = {
  prefs: { ...DEF, ...saved },
  now: SONGS[8], playing: false, pos: 47, vol: 0.7, muted: false, repeat: 0, shuffle: false,
  queue: [...SONGS.slice(9), ...NEW.slice(0, 4)],
  liked: new Set(["mj-8", "mj-6", "ss-0", "patient-zero"]),
  likedItems: new Set(["album:michael", "album:dhurandhar", "playlist:now-trending", "playlist:lofi", "artist:shashwat-sachdev", "artist:kishore-kumar"]),
  langs: new Set(["hindi", "english"]),
  playlists: [
    { id: "road-trip", name: "Road Trip", desc: "Windows down, volume up.", songs: ["mj-6", "mj-8", "ss-0", "patient-zero", "sawadika"] },
    { id: "focus-mode", name: "Focus Mode", desc: "", songs: ["mj-10", "mj-2", "mj-0"] },
    { id: "gym-hits", name: "Gym Hits", desc: "", songs: ["ss-1", "agua", "click", "choozay"] },
  ],
  recentSearches: [...MOCK.recentSearches],
  recentPlayed: ["mj-8", "ss-0", "patient-zero", "mj-6", "sawadika", "choozay"],
  user: { name: "Hemant", email: "hemant@example.test" }, loggedIn: true,
  keys: true, stream: "320kbps", download: "320kbps", image: "high",
  qOpen: innerWidth >= 1440, tabs: {}, view: { albums: "grid" }, sort: "popular",
};

/* ---------- Theme engine (drives the Appearance customizer) ---------- */
const FONTS = {
  system: ["System", '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif'],
  rounded: ["Rounded", 'ui-rounded, "SF Pro Rounded", Nunito, "Varela Round", system-ui, sans-serif'],
  grotesk: ["Grotesk", '"Helvetica Neue", Helvetica, Arial, sans-serif'],
  serif: ["Serif", 'ui-serif, "New York", Charter, Georgia, serif'],
  mono: ["Mono", 'ui-monospace, "SF Mono", Menlo, monospace'],
};
const RADII = [["0", 0], ["0.3", 5], ["0.5", 8], ["0.75", 12], ["1.0", 16]];
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const darkMQ = matchMedia("(prefers-color-scheme: dark)");
function applyPrefs() {
  const p = S.prefs, h = document.documentElement, dark = p.mode === "dark" || (p.mode === "system" && darkMQ.matches);
  h.classList.toggle("dark", dark);
  h.classList.toggle("glass-subtle", p.glass === "subtle");
  h.classList.toggle("glass-off", p.glass === "off");
  h.classList.toggle("no-ambient", !p.ambient);
  h.classList.toggle("compact", p.density === "compact");
  h.classList.toggle("reduce-motion", p.motion);
  let a = p.accent;
  if (dark && lum(a) < 0.03) a = "#f4f4f5";
  h.style.setProperty("--accent", a);
  h.style.setProperty("--on-accent", lum(a) > 0.45 ? "#111" : "#fff");
  h.style.setProperty("--r", p.radius + "px");
  h.style.setProperty("--font", FONTS[p.font][1]);
  h.style.setProperty("--font-head", FONTS[p.head][1]);
  h.style.setProperty("--base", p.size + "px");
  $('meta[name="theme-color"]').content = dark ? "#0b0b0c" : "#f5f5f7";
  localStorage.setItem("inf-prefs", JSON.stringify(p));
  window.Glass && Glass.apply();
}
darkMQ.addEventListener("change", applyPrefs);
function setPref(k, v) { S.prefs[k] = v; applyPrefs(); if (Router.current().name === "settings") refresh(); }

/* ---------- Spring physics (critically damped by default, interruptible) ---------- */
function spring({ from, to, velocity = 0, response = 0.35, damping = 1, onUpdate, onDone }) {
  const k = (2 * Math.PI / response) ** 2, c = (4 * Math.PI * damping) / response;
  let x = from, v = velocity, last = performance.now(), raf;
  const step = (t) => {
    const dt = Math.min(0.032, (t - last) / 1000); last = t;
    v += (-k * (x - to) - c * v) * dt; x += v * dt;
    if (Math.abs(v) < 2 && Math.abs(x - to) < 0.5) { onUpdate(to); onDone && onDone(); return; }
    onUpdate(x); raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

// Drag-to-dismiss for sheets: 1:1 tracking, velocity handoff, momentum projection, rubber-band upward.
function draggable(panel, onDismiss) {
  let y = 0, startY = 0, hist = [], stop = null, dragging = false;
  const set = (v) => { y = v; panel.style.transform = `translateY(${v}px)`; };
  let armed = null;
  panel.addEventListener("pointerdown", (e) => {
    if (!isMobile() || e.target.closest("input,textarea,select,.track")) return;
    const sc = e.target.closest(".np-scroll,.pbody");
    if (sc && sc.scrollTop > 0) return;
    stop && stop(); dragging = false; armed = e.pointerId; startY = e.clientY - y; hist = [[e.clientY, e.timeStamp]];
  });
  panel.addEventListener("pointermove", (e) => {
    if (armed !== e.pointerId) return;
    const d = e.clientY - startY;
    if (!dragging) { if (Math.abs(d - y) < 10) return; dragging = true; try { panel.setPointerCapture(e.pointerId); } catch {} }
    set(d < 0 ? rubber(d, panel.offsetHeight) : d);
    hist.push([e.clientY, e.timeStamp]); if (hist.length > 5) hist.shift();
  });
  const end = (e) => {
    if (armed !== e.pointerId) return;
    armed = null;
    if (!dragging) return;
    try { panel.releasePointerCapture(e.pointerId); } catch {}
    const [a, b] = [hist[0], hist[hist.length - 1]];
    const vel = b[1] > a[1] ? ((b[0] - a[0]) / (b[1] - a[1])) * 1000 : 0;
    const h = panel.offsetHeight, dismiss = y + project(vel) > h * 0.4;
    stop = spring({ from: y, to: dismiss ? h : 0, velocity: vel, damping: dismiss ? 1 : 0.8, response: 0.3, onUpdate: set, onDone: dismiss ? onDismiss : null });
    if (dismiss) panel.parentElement.querySelector(".scrim")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
    const swallow = (ev) => ev.stopPropagation();
    panel.addEventListener("click", swallow, true);
    setTimeout(() => panel.removeEventListener("click", swallow, true), 60);
  };
  panel.addEventListener("pointerup", end);
  panel.addEventListener("pointercancel", end);
  return {
    enter() { if (!isMobile() || S.prefs.motion) return; set(panel.offsetHeight); stop = spring({ from: y, to: 0, response: 0.35, damping: 1, onUpdate: set }); },
    leave(done) { if (!isMobile() || S.prefs.motion) return done(); stop && stop(); stop = spring({ from: y, to: panel.offsetHeight, response: 0.3, damping: 1, onUpdate: set, onDone: done }); },
  };
}

/* ---------- Small builders ---------- */
const songsFor = (go = "") => {
  if (go.includes("michael")) return SONGS;
  if (go.includes("dhurandhar") || go.includes("shashwat") || go.includes("jio")) return ART_SONGS;
  if (go.startsWith("show") || go.startsWith("episode")) return EPS;
  if (go.startsWith("me/playlist/")) return plSongs(S.playlists.find((p) => p.id === go.split("/")[2]));
  const n = [...go].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  return [...NEW.slice(n), ...SONGS.slice(n, n + 6), ...NEW.slice(0, n)];
};
const plSongs = (pl) => (pl ? pl.songs.map(byId).filter(Boolean) : []);
const totalTime = (list) => { const t = list.reduce((a, s) => a + secs(s.d), 0); return t >= 3600 ? `${Math.floor(t / 3600)} hr ${Math.round((t % 3600) / 60)} min` : `${Math.round(t / 60)} min`; };
const cover = (o, size = 150) => (o.grad != null ? "" : src(o.img || o.i, size));
const gcov = (o) => `<div class="gcov" style="--g:${GRADS[o.grad % GRADS.length]}">${esc(o.title.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</div>`;

function card(o) {
  const art = o.grad != null ? gcov(o) : `<img src="${cover(o, 500)}" alt="" loading="lazy">`;
  return `<div class="card${o.round ? " round" : ""}" data-go="${o.go}" title="${esc(o.title)}">
    <div class="art">${art}${o.rank ? `<span class="rank">${o.rank}</span>` : ""}<button class="play" data-act="playcard" data-src="${o.go}" aria-label="Play ${esc(o.title)}">${icon("play")}</button></div>
    <div><b class="ell">${esc(o.title)}</b><small class="ell">${esc(o.subtitle || "")}</small></div></div>`;
}
const A = (a) => ({ ...a, go: "album/" + a.id });
const PL = (p) => ({ ...p, go: "playlist/" + p.id });
const AR = (a) => ({ title: a.name, subtitle: "Artist", img: a.img, round: true, go: "artist/" + a.id });
const SH = (s) => ({ ...s, go: "show/" + s.id });
const ST = (s) => ({ ...s, round: true, go: "radio/" + s.id });
const SG = (s) => ({ title: s.t, subtitle: s.a, img: s.i, go: "song/" + s.id });
const UPL = (p) => ({ title: p.name, subtitle: `${p.songs.length} songs`, img: plSongs(p)[0]?.i, go: "me/playlist/" + p.id });

const shelf = (title, items, more) => `<section class="sec"><div class="sec-h"><h2>${title}</h2>${more ? `<a class="link" data-go="${more}">See all</a>` : ""}</div><div class="shelf">${items.map(card).join("")}</div></section>`;
const grid = (items) => `<div class="grid">${items.map(card).join("")}</div>`;
const LISTS = {};
function row(s, n, key, extra = "") {
  const cur = S.now.id === s.id;
  const artist = s.arId ? `<a data-go="artist/${s.arId}">${esc(s.a)}</a>` : esc(s.a);
  return `<div class="tr${cur ? " cur" : ""}${cur && !S.playing ? " paused" : ""}" data-id="${s.id}" data-list="${key}" data-extra="${extra}">
    <span class="n"><em>${cur && S.playing ? EQ : n + 1}</em><button class="ib" data-act="playrow" aria-label="${cur && S.playing ? "Pause" : "Play"}">${icon(cur && S.playing ? "pause" : "play")}</button></span>
    <span class="ti"><img src="${src(s.i)}" alt="" loading="lazy"><span class="tt"><b>${esc(s.t)}</b><small>${artist}</small></span></span>
    <span class="ar">${artist}</span>
    <span class="t-al">${s.alId ? `<a data-go="album/${s.alId}">${esc(s.al)}</a>` : esc(s.al)}</span>
    <span class="du">${s.d}</span>
    <span class="ac"><button class="ib like${S.liked.has(s.id) ? " on" : ""}" data-act="like" data-id="${s.id}" aria-label="Like">${icon("heart", "fill")}</button><button class="ib" data-act="more" data-id="${s.id}" data-extra="${extra}" aria-label="More options">${icon("more")}</button></span>
  </div>`;
}
function tracks(list, key, extra = "") {
  LISTS[key] = list;
  return `<div class="tl"><div class="th"><span style="text-align:center">#</span><span>Title</span><span class="ar">Artist</span><span class="t-al">Album</span><span style="text-align:right">${icon("clock")}</span><span></span></div>${list.map((s, n) => row(s, n, key, extra)).join("")}</div>`;
}
const densityToggle = () => `<div class="seg" role="group" aria-label="Density"><button class="${S.prefs.density === "comfortable" ? "on" : ""}" data-act="density" data-v="comfortable" aria-label="Comfortable rows">${icon("rows")}</button><button class="${S.prefs.density === "compact" ? "on" : ""}" data-act="density" data-v="compact" aria-label="Compact table">${icon("layout")}</button></div>`;
const tabs = (key, list, cur) => `<div class="tabs" role="tablist">${list.map(([v, l]) => `<button role="tab" class="${cur === v ? "on" : ""}" data-act="tab" data-k="${key}" data-v="${v}">${l}</button>`).join("")}</div>`;
const likeItem = (k) => `<button class="ib${S.likedItems.has(k) ? " on" : ""}" data-act="likeitem" data-k="${k}" aria-label="${S.likedItems.has(k) ? "Remove from library" : "Add to library"}">${icon("heart", "fill")}</button>`;
const empty = (ic, title, text, cta = "") => `<div class="empty"><div class="ic">${icon(ic)}</div><h3>${title}</h3><p>${text}</p>${cta}</div>`;

function dhead({ img, kind, title, meta, actions, round, collage, src: go }) {
  const bg = collage ? src(collage[0], 500) : src(img, 500);
  const art = collage
    ? `<div class="collage">${[0, 1, 2, 3].map((k) => `<img src="${src(collage[k % collage.length], 150)}" alt="">`).join("")}</div>`
    : `<img class="cover${round ? " round" : ""}" src="${src(img, 500)}" alt="">`;
  return `<header class="dhead"><div class="bgart" style="background-image:url('${bg}')"></div>${art}
    <div><div class="kind">${kind}</div><h1>${esc(title)}</h1><div class="meta">${meta}</div><div class="actions">${actions}</div></div></header>`;
}
const playBtns = (go, k, opts = {}) => `<button class="btn pri lg" data-act="playall" data-src="${go}">${icon("play")} ${opts.label || "Play"}</button>
  <button class="btn lg" data-act="shuffleall" data-src="${go}">${icon("shuffle")} Shuffle</button>
  ${k ? likeItem(k) : ""}${opts.noDl ? "" : `<button class="ib" data-act="download" data-src="${go}" aria-label="Download">${icon("download")}</button>`}
  <button class="ib" data-act="share" data-title="${esc(opts.title || "")}" aria-label="Share">${icon("share")}</button>
  <button class="ib" data-act="emore" data-src="${go}" aria-label="More options">${icon("more")}</button>`;

/* ---------- Pages ---------- */
function home() {
  const hour = new Date().getHours(), greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const quick = [A(MOCK.albums[0]), PL(MOCK.playlists[0]), A(MOCK.albums[1]), PL(MOCK.playlists[2]), A(MOCK.albums[2]), PL(MOCK.playlists[6]), A(MOCK.albums[3]), UPL(S.playlists[0])];
  const hero = MOCK.playlists[1];
  return ["Home", `
    <div class="phead"><div><h1 class="ptitle">${greet}${S.loggedIn ? ", " + esc(S.user.name) : ""}</h1><p class="psub">Fresh picks in ${[...S.langs].map((l) => l[0].toUpperCase() + l.slice(1)).join(" and ")}.</p></div>
      <button class="btn" data-act="surprise" aria-label="Surprise Me - Add songs to queue and play">${icon("sparkles")} Surprise me</button></div>
    <div class="chips"><button class="chip on">For you</button>${MOCK.languages.slice(0, 10).map((l) => `<button class="chip" data-go="albums/${l.toLowerCase()}">${l}</button>`).join("")}</div>
    <div class="hero-row">
      <div class="hero" data-go="playlist/${hero.id}"><img src="${src(hero.img)}" alt="">
        <div class="cap glass"><small>Featured playlist</small><h2>${esc(hero.title)}</h2><span class="muted">The biggest international songs this year, updated weekly.</span>
          <div class="actions" style="margin-top:0.25rem"><button class="btn pri" data-act="playall" data-src="playlist/${hero.id}">${icon("play")} Play</button>${likeItem("playlist:" + hero.id)}</div></div></div>
      <div><div class="sec-h"><h2>Jump back in</h2></div><div class="quick">${quick.map((q) => `<div class="qtile" data-go="${q.go}"><img src="${src(q.img)}" alt=""><span class="ell">${esc(q.title)}</span></div>`).join("")}</div></div>
    </div>
    ${shelf("Trending now", [...MOCK.playlists.slice(0, 4).map(PL), ...MOCK.albums.slice(0, 6).map(A)], "playlists")}
    ${shelf("New releases", NEW.map(SG), "albums")}
    ${shelf("Top charts", MOCK.charts.map((c, k) => ({ ...PL(c), rank: k + 1 })), "chart")}
    ${shelf("Top artists", ARTISTS.slice(0, 8).map(AR), "artists")}
    ${shelf("Made for you", [{ ...MIX, go: "mix/" + MIX.id }, ...MOCK.playlists.slice(4).map(PL)], "playlists")}
    ${shelf("Radio stations", STATIONS.map(ST), "radio")}
    ${shelf("Podcasts", SHOWS.map(SH), "shows")}`];
}

function browseTiles() {
  const t = [["Top Albums", "albums", MOCK.albums[1].img], ["Top Charts", "chart", MOCK.charts[0].img], ["Top Playlists", "playlists", MOCK.playlists[3].img], ["Podcasts", "shows", SHOW_IMG], ["Top Artists", "artists", MOCK.artists[3].img], ["Radio", "radio", MOCK.playlists[6].img], ["New Releases", "albums", NEW[0].i], ["Made for you", "mix/" + MIX.id, MIX.img]];
  return `<div class="tiles">${t.map(([n, go, i], k) => `<a class="tile" data-go="${go}" style="background:${TILE_COLORS[k]}"><span>${n}</span><img src="${src(i)}" alt=""></a>`).join("")}</div>`;
}
function browse() {
  return ["Browse", `<div class="phead"><div><h1 class="ptitle">Browse</h1><p class="psub">Explore by category, language or mood.</p></div></div>
    ${browseTiles()}
    <section class="sec"><div class="sec-h"><h2>Languages</h2></div><div class="tiles">${MOCK.languages.map((l, k) => `<a class="tile" data-go="albums/${l.toLowerCase()}" style="background:linear-gradient(135deg,${TILE_COLORS[k % 8]},${TILE_COLORS[(k + 3) % 8]});height:4.5rem">${l}</a>`).join("")}</div></section>`];
}

function albums(lang) {
  const v = S.view.albums;
  const list = MOCK.albums.map(A);
  return ["Top Albums", `<div class="phead"><div><h1 class="ptitle">Top Albums</h1><p class="psub">${lang ? lang[0].toUpperCase() + lang.slice(1) + " albums trending this week" : "Trending across your languages"}</p></div>
      <div class="seg"><button class="${v === "grid" ? "on" : ""}" data-act="view" data-v="grid" aria-label="Grid view">${icon("grid")}</button><button class="${v === "list" ? "on" : ""}" data-act="view" data-v="list" aria-label="List view">${icon("rows")}</button></div></div>
    <div class="chips"><button class="chip${!lang ? " on" : ""}" data-go="albums">All</button>${MOCK.languages.map((l) => `<button class="chip${lang === l.toLowerCase() ? " on" : ""}" data-go="albums/${l.toLowerCase()}">${l}</button>`).join("")}</div>
    ${v === "grid" ? grid(list) : `<div class="tl">${MOCK.albums.map((a, k) => `<div class="tr" data-go="album/${a.id}"><span class="n"><em>${k + 1}</em></span><span class="ti"><img src="${src(a.img)}" alt=""><span class="tt"><b>${esc(a.title)}</b><small>${esc(a.subtitle)}</small></span></span><span class="ar">${esc(a.subtitle)}</span><span class="t-al"></span><span class="du">${a.year}</span><span class="ac">${likeItem("album:" + a.id)}</span></div>`).join("")}</div>`}`];
}
const simplePage = (title, sub, items) => [title, `<div class="phead"><div><h1 class="ptitle">${title}</h1><p class="psub">${sub}</p></div></div>${grid(items)}`];

function chart() {
  return ["Top Charts", `<div class="phead"><div><h1 class="ptitle">Top Charts</h1><p class="psub">Updated every Friday.</p></div></div>
    ${grid(MOCK.charts.map((c, k) => ({ ...PL(c), rank: k + 1 })))}
    <section class="sec"><div class="sec-h"><h2>Top songs this week</h2><div class="more">${densityToggle()}</div></div>${tracks([...NEW, ...ART_SONGS.slice(0, 3)], "chart-top")}</section>`];
}

function album(id) {
  const a = MOCK.albums.find((x) => x.id === id) || ALB;
  const list = id === "michael" ? SONGS : id === "dhurandhar" ? ART_SONGS : songsFor("album/" + id).slice(0, 8);
  const arId = id === "michael" ? "michael-jackson" : id === "dhurandhar" ? "shashwat-sachdev" : "";
  return [a.title, dhead({ img: a.img, kind: "Album", title: a.title,
      meta: `${arId ? `<a data-go="artist/${arId}">${esc(a.subtitle)}</a>` : esc(a.subtitle)}<span>·</span><span>${a.year}</span><span>·</span><span>${list.length} songs, ${totalTime(list)}</span>`,
      actions: playBtns("album/" + id, "album:" + id, { title: a.title }) })
    + `<div class="list-tools"><span class="muted">${list.length} songs</span>${densityToggle()}</div>${tracks(list, "album-" + id)}
    <p class="muted t-caption" style="margin-top:1rem">Released ${a.year}. ℗ ${a.year} ${id === "dhurandhar" ? "Jio Studios" : "Sony Music"}. <a class="link" data-go="label/${LABEL.id}">View label</a></p>
    ${shelf("More from " + esc(a.subtitle), MOCK.albums.slice(1, 9).map(A))}${shelf("You might also like", MOCK.playlists.map(PL))}`];
}

function playlist(id, kind = "Playlist") {
  const p = [...MOCK.playlists, ...MOCK.charts].find((x) => x.id === id) || (id === MIX.id ? MIX : MOCK.playlists[0]);
  const list = songsFor("playlist/" + id);
  return [p.title, dhead({ img: p.img, kind, title: p.title,
      meta: `<a data-go="home">Infinitunes</a><span>·</span><span>${esc(p.subtitle)}</span><span>·</span><span>${list.length} songs, ${totalTime(list)}</span>`,
      actions: playBtns("playlist/" + id, "playlist:" + id, { title: p.title }) })
    + `<p class="muted" style="max-width:40rem;margin:0 0 0.5rem">The hits everyone is playing right now, refreshed every week.</p>
    <div class="list-tools"><span class="muted">${list.length} songs</span>${densityToggle()}</div>${tracks(list, "pl-" + id)}${shelf("More like this", MOCK.playlists.filter((x) => x.id !== id).map(PL))}`];
}

function song(id) {
  const s = byId(id) || SONGS[8];
  const more = s.alId === "michael" ? SONGS : s.alId === "dhurandhar" ? ART_SONGS : NEW;
  return [s.t, dhead({ img: s.i, kind: "Song", title: s.t,
      meta: `${s.arId ? `<a data-go="artist/${s.arId}">${esc(s.a)}</a>` : esc(s.a)}<span>·</span>${s.alId ? `<a data-go="album/${s.alId}">${esc(s.al)}</a>` : `<span>${esc(s.al)}</span>`}<span>·</span><span>2026</span><span>·</span><span>${s.d}</span><span>·</span><span>1.2M plays</span>`,
      actions: `<button class="btn pri lg" data-act="playone" data-id="${s.id}">${icon("play")} Play</button><button class="ib${S.liked.has(s.id) ? " on" : ""}" data-act="like" data-id="${s.id}" aria-label="Like">${icon("heart", "fill")}</button><button class="ib" data-act="download" data-id="${s.id}" aria-label="Download">${icon("download")}</button><button class="ib" data-act="share" data-title="${esc(s.t)}" aria-label="Share">${icon("share")}</button><button class="ib" data-act="more" data-id="${s.id}" aria-label="More options">${icon("more")}</button>` })
    + `<div class="two" style="margin-top:1rem">
      <section class="panel lyrics"><div class="sec-h sm"><h2>Lyrics</h2><span class="muted t-caption">Preview</span></div>
        ${[80, 64, 72, 50, 0, 76, 58, 68].map((w, k) => (w ? `<div class="skel" style="height:0.75rem;width:${w}%;margin:0 0 0.75rem;${k === 2 ? "background:var(--fill-2)" : ""}"></div>` : `<div style="height:0.75rem"></div>`)).join("")}
        <p class="muted t-caption" style="margin-top:1rem;font-weight:400">Synced lyrics appear here when available.</p></section>
      <section class="panel"><div class="sec-h sm"><h2>Details</h2></div>
        <dl class="kv"><dt>Album</dt><dd>${s.alId ? `<a class="link" data-go="album/${s.alId}">${esc(s.al)}</a>` : esc(s.al)}</dd><dt>Artist</dt><dd>${esc(s.a)}</dd><dt>Language</dt><dd>English</dd><dt>Duration</dt><dd>${s.d}</dd><dt>Label</dt><dd><a class="link" data-go="label/${LABEL.id}">${LABEL.name}</a></dd><dt>Quality</dt><dd>${S.stream}</dd><dt>Copyright</dt><dd class="muted">℗ 2026</dd></dl></section>
    </div>
    <section class="sec"><div class="sec-h"><h2>More from ${esc(s.al)}</h2><a class="link" data-go="album/${s.alId || "michael"}">See album</a></div>${tracks(more.filter((x) => x.id !== s.id).slice(0, 5), "song-more")}</section>
    ${shelf("Similar songs", NEW.filter((x) => x.id !== s.id).map(SG))}`];
}

function artist(id) {
  const a = ARTISTS.find((x) => x.id === id) || ARTISTS[0];
  const list = id === "michael-jackson" ? SONGS : ART_SONGS;
  const tab = S.tabs["artist"] || "overview";
  const sorted = [...list].sort((x, y) => (S.sort === "az" ? x.t.localeCompare(y.t) : S.sort === "latest" ? y.id.localeCompare(x.id) : 0));
  const body = {
    overview: `<section><div class="sec-h"><h2>Popular</h2><a class="link" data-act="tab" data-k="artist" data-v="songs">See all</a></div>${tracks(list.slice(0, 5), "ar-top")}</section>
      ${shelf("Albums", MOCK.albums.slice(0, 6).map(A))}${shelf("Featured in", MOCK.playlists.slice(2, 8).map(PL))}${shelf("Fans also like", ARTISTS.filter((x) => x.id !== id).map(AR))}`,
    songs: `<div class="list-tools"><div class="seg" aria-label="Sort songs"><button class="${S.sort === "popular" ? "on" : ""}" data-act="sort" data-v="popular">Popular</button><button class="${S.sort === "latest" ? "on" : ""}" data-act="sort" data-v="latest">Latest</button><button class="${S.sort === "az" ? "on" : ""}" data-act="sort" data-v="az">A-Z</button></div>${densityToggle()}</div>${tracks(sorted, "ar-songs")}`,
    albums: grid(MOCK.albums.map(A)),
    bio: `<div class="two"><section class="panel prose" style="max-width:none"><p style="color:var(--text);font-size:1rem;margin-top:0">${esc(a.name)} is a composer and producer known for film soundtracks and chart-topping singles.</p><p>This is placeholder biography copy for the mockup. The real page renders the artist bio from the catalog, with a Read more toggle when it is long.</p></section>
      <section class="panel"><dl class="kv"><dt>Listeners</dt><dd>${a.listeners}</dd><dt>Followers</dt><dd>1.1M</dd><dt>Languages</dt><dd>Hindi, Punjabi</dd><dt>Socials</dt><dd><a class="link">X</a> · <a class="link">Wikipedia</a></dd></dl></section></div>`,
  }[tab];
  const fol = S.likedItems.has("artist:" + id);
  return [a.name, dhead({ img: a.img, round: true, kind: `Artist <span class="verified">${icon("badge")} Verified</span>`, title: a.name,
      meta: `<span>${a.listeners} monthly listeners</span>`,
      actions: `<button class="btn pri lg" data-act="playall" data-src="artist/${id}">${icon("play")} Play</button><button class="btn lg" data-act="shuffleall" data-src="artist/${id}">${icon("shuffle")} Shuffle</button><button class="btn lg${fol ? " pri" : ""}" data-act="likeitem" data-k="artist:${id}">${fol ? icon("check") + " Following" : "Follow"}</button><button class="ib" data-act="share" data-title="${esc(a.name)}" aria-label="Share">${icon("share")}</button><button class="ib" data-act="emore" data-src="artist/${id}" aria-label="More options">${icon("more")}</button>` })
    + tabs("artist", [["overview", "Overview"], ["songs", "Songs"], ["albums", "Albums"], ["bio", "Biography"]], tab) + body];
}

function label() {
  const tab = S.tabs["label"] || "songs";
  return [LABEL.name, dhead({ img: LABEL.img, kind: "Label", title: LABEL.name, meta: "<span>Record label</span><span>·</span><span>1,240 songs</span>", actions: playBtns("label/" + LABEL.id, "label:" + LABEL.id, { noDl: true, title: LABEL.name }) })
    + tabs("label", [["songs", "Top songs"], ["albums", "Albums"]], tab) + (tab === "songs" ? tracks(ART_SONGS, "label") : grid(MOCK.albums.slice(1).map(A)))];
}

function station(id) {
  const s = STATIONS.find((x) => x.id === id) || STATIONS[0];
  return [s.title, dhead({ img: s.img, round: true, kind: "Radio station", title: s.title, meta: "<span>Live</span><span>·</span><span>Endless mix of featured hits</span>",
      actions: `<button class="btn pri lg" data-act="playall" data-src="radio/${id}">${icon("radio")} Play Radio</button>${likeItem("radio:" + id)}<button class="ib" data-act="share" data-title="${esc(s.title)}" aria-label="Share">${icon("share")}</button>` })
    + `<section class="sec" style="margin-top:0.5rem"><div class="sec-h"><h2>Coming up</h2></div>${tracks(songsFor("radio/" + id), "radio-" + id)}</section>${shelf("More stations", STATIONS.filter((x) => x.id !== id).map(ST))}`];
}

function show(id) {
  const s = SHOWS.find((x) => x.id === id) || SHOW;
  const img = s.img || SHOW_IMG;
  return [s.title, dhead({ img, kind: "Podcast", title: s.title, meta: `<span>${esc(s.subtitle)}</span><span>·</span><span>1 season</span><span>·</span><span>${EPS.length} episodes</span>`,
      actions: `<button class="btn pri lg" data-act="playall" data-src="show/${id}">${icon("play")} Latest episode</button><button class="btn lg${S.likedItems.has("show:" + id) ? " pri" : ""}" data-act="likeitem" data-k="show:${id}">${S.likedItems.has("show:" + id) ? icon("check") + " Following" : "Follow"}</button><button class="ib" data-act="share" data-title="${esc(s.title)}" aria-label="Share">${icon("share")}</button>` })
    + `<p class="muted" style="max-width:44rem;margin:0 0 1.25rem">A collection of devotional recitations. Placeholder description: the real page shows the show summary from the catalog.</p>
    <div class="list-tools"><select class="input" aria-label="Season" style="width:10rem"><option>Season 1</option></select><span class="muted">${EPS.length} episodes</span></div>
    ${tracks(EPS, "eps", "ep")}`];
}

function episode(id) {
  const e = EPS.find((x) => x.id === id) || EPS[0];
  return [e.t, dhead({ img: e.i, kind: "Episode", title: e.t, meta: `<a data-go="show/${SHOW.id}">${SHOW.title}</a><span>·</span><span>${e.al}</span><span>·</span><span>${e.d}</span>`,
      actions: `<button class="btn pri lg" data-act="playone" data-id="${e.id}">${icon("play")} Play episode</button><button class="ib${S.liked.has(e.id) ? " on" : ""}" data-act="like" data-id="${e.id}" aria-label="Like">${icon("heart", "fill")}</button><button class="ib" data-act="share" data-title="${esc(e.t)}" aria-label="Share">${icon("share")}</button>` })
    + `<section class="panel" style="max-width:44rem"><h2 class="t-sub" style="margin-bottom:0.5rem">About this episode</h2><p class="muted" style="margin:0">Placeholder episode notes. The real page renders the episode description, release date and the show it belongs to.</p></section>
    <section class="sec"><div class="sec-h"><h2>More episodes</h2><a class="link" data-go="show/${SHOW.id}">All episodes</a></div>${tracks(EPS.filter((x) => x.id !== id), "ep-more", "ep")}</section>`];
}

const match = (q) => (s) => (s.t || s.title || s.name || "").toLowerCase().includes(q) || (s.a || s.subtitle || "").toLowerCase().includes(q);
function results(q) {
  const l = q.toLowerCase();
  let r = { songs: ALL.filter((s) => !s.ep).filter(match(l)), albums: MOCK.albums.filter(match(l)), playlists: [...MOCK.playlists, ...MOCK.charts].filter(match(l)), artists: ARTISTS.filter(match(l)), shows: SHOWS.filter(match(l)) };
  const none = !Object.values(r).some((x) => x.length);
  if (none) r = { songs: NEW.slice(0, 6), albums: MOCK.albums.slice(0, 6), playlists: MOCK.playlists.slice(0, 6), artists: ARTISTS.slice(0, 6), shows: SHOWS.slice(0, 4) };
  return { r, none };
}
function search(params) {
  if (!params.length) {
    return ["Search", `<div class="phead"><div><h1 class="ptitle">Search</h1></div></div>
      <button class="searchbox lg" data-act="palette" style="margin-bottom:1.5rem">${icon("search")}<span>Songs, albums, artists, podcasts</span><kbd>⌘K</kbd></button>
      ${S.recentSearches.length ? `<section><div class="sec-h"><h2>Recent searches</h2><button class="link" data-act="clearrecent">Clear</button></div><div class="chips">${S.recentSearches.map((q) => `<button class="chip" data-go="search/${encodeURIComponent(q)}">${icon("clock")} ${esc(q)}</button>`).join("")}</div></section>` : ""}
      <section class="sec"><div class="sec-h"><h2>Top searches</h2></div>${tracks(NEW.slice(0, 5), "top-search")}</section>
      <section class="sec"><div class="sec-h"><h2>Browse all</h2></div>${browseTiles()}</section>`];
  }
  const types = ["songs", "albums", "playlists", "artists", "podcasts"];
  const type = types.includes(params[0]) && params[1] ? params[0] : "all";
  const q = type === "all" ? params[0] : params[1];
  const { r, none } = results(q);
  const top = r.artists[0] ? AR(r.artists[0]) : r.albums[0] ? A(r.albums[0]) : SG(r.songs[0]);
  const seg = `<div class="chips">${[["all", "All"], ...types.map((t) => [t, t[0].toUpperCase() + t.slice(1)])].map(([t, l]) => `<button class="chip${t === type ? " on" : ""}" data-go="${t === "all" ? "search/" + encodeURIComponent(q) : "search/" + t + "/" + encodeURIComponent(q)}">${l}</button>`).join("")}</div>`;
  const body = {
    all: `<div class="two sr"><section><div class="sec-h"><h2>Top result</h2></div>
        <div class="panel" data-go="${top.go}" style="cursor:pointer;display:grid;gap:0.75rem"><img src="${src(top.img, 500)}" alt="" style="width:6rem;height:6rem;object-fit:cover;border-radius:${top.round ? "50%" : "var(--r)"};box-shadow:var(--shadow-sm)"><div><h3 class="t-headline">${esc(top.title)}</h3><span class="muted">${esc(top.subtitle)}</span></div><div><button class="btn pri" data-act="playall" data-src="${top.go}">${icon("play")} Play</button></div></div></section>
        <section><div class="sec-h"><h2>Songs</h2><a class="link" data-go="search/songs/${encodeURIComponent(q)}">See all</a></div>${tracks(r.songs.slice(0, 4), "sr-songs")}</section></div>
      ${r.albums.length ? shelf("Albums", r.albums.map(A)) : ""}${r.artists.length ? shelf("Artists", r.artists.map(AR)) : ""}${r.playlists.length ? shelf("Playlists", r.playlists.map(PL)) : ""}${r.shows.length ? shelf("Podcasts", r.shows.map(SH)) : ""}`,
    songs: tracks(r.songs, "sr-all"),
    albums: grid(r.albums.map(A)),
    playlists: grid(r.playlists.map(PL)),
    artists: grid(r.artists.map(AR)),
    podcasts: grid(r.shows.map(SH)),
  }[type];
  return [`Results for "${q}"`, `<div class="phead"><div><h1 class="ptitle">Results for "${esc(q)}"</h1>${none ? `<p class="psub">No exact matches. Showing popular results instead.</p>` : ""}</div></div>${seg}${body}`];
}

const ME_TABS = [["", "Playlists"], ["recently-played", "Recently played"], ["liked-songs", "Liked songs"], ["albums", "Albums"], ["playlists", "Saved playlists"], ["artists", "Artists"], ["shows", "Podcasts"]];
function me(tab = "") {
  if (!S.loggedIn) return ["Library", empty("library", "Your library lives here", "Log in to keep liked songs, playlists and history in sync across devices.", `<button class="btn pri" data-go="login">Log in</button>`)];
  const liked = [...S.liked].map(byId).filter(Boolean);
  const items = (type, list) => list.filter((x) => S.likedItems.has(type + ":" + x.id));
  const body = {
    "": `<div class="grid"><button class="card" data-act="newpl" style="text-align:left"><div class="art new">${icon("plus")}</div><div><b>New playlist</b><small>Start a collection</small></div></button>${S.playlists.map((p) => `<div class="card" data-go="me/playlist/${p.id}"><div class="art" style="display:grid;grid-template-columns:1fr 1fr">${[0, 1, 2, 3].map((k) => { const s = plSongs(p); return s.length ? `<img src="${src(s[k % s.length].i)}" alt="">` : ""; }).join("")}</div><div><b class="ell">${esc(p.name)}</b><small>${p.songs.length} songs</small></div></div>`).join("")}</div>`,
    "recently-played": `<div class="list-tools"><button class="btn pri" data-act="playlist-list" data-k="recent">${icon("play")} Play all</button>${densityToggle()}</div>${tracks(S.recentPlayed.map(byId), "recent")}`,
    "liked-songs": liked.length ? `<div class="list-tools"><button class="btn pri" data-act="playlist-list" data-k="liked">${icon("play")} Play all</button>${densityToggle()}</div>${tracks(liked, "liked")}` : empty("heart", "Songs you like will appear here", "Tap the heart on any song to save it.", `<button class="btn" data-go="home">Find songs</button>`),
    albums: items("album", MOCK.albums).length ? grid(items("album", MOCK.albums).map(A)) : empty("disc", "No saved albums", "Save albums to find them quickly."),
    playlists: grid(items("playlist", [...MOCK.playlists, ...MOCK.charts]).map(PL)),
    artists: grid(items("artist", ARTISTS).map(AR)),
    shows: items("show", SHOWS).length ? grid(items("show", SHOWS).map(SH)) : empty("mic", "Follow podcasts you love", "New episodes from shows you follow show up here.", `<button class="btn" data-go="shows">Browse podcasts</button>`),
  }[tab];
  return ["Library", `<header class="phead" style="align-items:center;justify-content:flex-start;gap:1.25rem"><div class="avatar" style="width:5rem;height:5rem;font-size:1.75rem">${esc(S.user.name[0])}</div>
      <div style="flex:1;min-width:12rem"><h1 class="ptitle">${esc(S.user.name)}</h1><p class="psub">${esc(S.user.email)} · ${S.playlists.length} playlists · ${S.liked.size} liked songs</p></div>
      <div class="actions" style="margin:0"><button class="btn" data-go="settings">${icon("pencil")} Edit profile</button><button class="btn danger" data-act="logout">${icon("logout")} Log out</button></div></header>
    <div class="tabs">${ME_TABS.map(([v, l]) => `<button class="${tab === v ? "on" : ""}" data-go="me${v ? "/" + v : ""}">${l}</button>`).join("")}</div>${body}`];
}

function userPlaylist(id) {
  const p = S.playlists.find((x) => x.id === id);
  if (!p) return notFound();
  const list = plSongs(p);
  return [p.name, dhead({ collage: list.length ? list.map((s) => s.i) : [ALB.img], kind: "Playlist · Private", title: p.name,
      meta: `${p.desc ? `<span>${esc(p.desc)}</span><span>·</span>` : ""}<span>${esc(S.user.name)}</span><span>·</span><span>${list.length} songs, ${totalTime(list)}</span>`,
      actions: `<button class="btn pri lg" data-act="playall" data-src="me/playlist/${id}"${list.length ? "" : " disabled"}>${icon("play")} Play</button><button class="btn lg" data-act="shuffleall" data-src="me/playlist/${id}">${icon("shuffle")} Shuffle</button><button class="btn lg" data-act="palette">${icon("plus")} Add songs</button><button class="ib" data-act="plmanage" data-id="${id}" aria-label="Playlist options">${icon("more")}</button>` })
    + (list.length ? `<div class="list-tools"><span class="muted">${list.length} songs</span>${densityToggle()}</div>${tracks(list, "upl-" + id, "pl:" + id)}` : empty("listmusic", "This playlist is empty", "Search for songs and add them with the More menu.", `<button class="btn pri" data-act="palette">${icon("search")} Find songs</button>`))];
}

/* Settings: original structure (Account / Appearance / Preferences) with compact controls and the theme customizer. */
const SET_NAV = [
  ["Account", "settings", [["profile", "user", "Edit Profile"], ["password", "key", "Change Password"], ["passkeys", "key", "Passkeys"], ["delete", "trash", "Delete Account"]]],
  ["Appearance", "settings/appearance", [["mode", "sun", "Mode"], ["accent", "palette", "Accent color"], ["radius", "radius", "Radius"], ["type", "type", "Typography"], ["density", "rows", "Density"], ["material", "layers", "Glass and motion"]]],
  ["Preferences", "settings/preferences", [["language", "langs", "Language"], ["stream", "headphones", "Stream Quality"], ["download-q", "download", "Download Quality"], ["image-q", "image", "Image Quality"], ["keyboard", "keyboard", "Keyboard"]]],
];
const opt = (on, act, v, label, extra = "") => `<button class="opt${on ? " on" : ""}" data-act="${act}" data-v="${v}" aria-pressed="${on}">${extra}${label}</button>`;
const sw = (on, act, label) => `<button class="switch${on ? " on" : ""}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}"></button>`;
function settings(page = "") {
  const p = S.prefs;
  const cur = page ? "settings/" + page : "settings";
  const nav = `<nav class="set-nav">${SET_NAV.map(([g, path, items]) => `<div><h3>${g}</h3>${items.map(([id, ic, l]) => `<a class="${path === cur && S.tabs.setsec === id ? "on" : ""}" data-act="setnav" data-page="${path}" data-sec="${id}">${icon(ic)} ${l}</a>`).join("")}</div>`).join("")}</nav>`;
  let body = "";
  if (!page) {
    body = `<section class="set-sec" id="profile"><h2>Account Settings</h2><p>This is how others will see you on the site.</p>
        <div class="set-form"><div class="fields">
          <div class="field"><label for="f-name">Name</label><input id="f-name" class="input" value="${esc(S.user.name)}"><small>Your name will be displayed on the site.</small></div>
          <div class="field"><label for="f-mail">Email</label><input id="f-mail" class="input" type="email" value="${esc(S.user.email)}"><small>Your email will be used for account notifications.</small></div>
          <div><button class="btn pri sq" data-act="toast" data-msg="Profile updated">Save Changes</button></div></div>
          <div style="display:grid;justify-items:center;gap:0.75rem"><div class="avatar">${esc(S.user.name[0])}</div><button class="btn" data-act="toast" data-msg="Avatar picker opens here">Change avatar</button></div></div></section>
      <section class="set-sec" id="password"><h2>Change Password</h2><p>Required to change your password, and your email if you have a password. Passkey or OAuth only accounts can leave it blank if they signed in within the last 10 minutes.</p>
        <div class="fields" style="max-width:28rem">
          <div class="field"><label for="f-cur">Current Password</label><div class="pw"><input id="f-cur" class="input" type="password" value="password123"><button class="ib" data-act="peek" aria-label="Show password">${icon("eye")}</button></div></div>
          <div class="field"><label for="f-new">New Password</label><div class="pw"><input id="f-new" class="input" type="password"><button class="ib" data-act="peek" aria-label="Show password">${icon("eye")}</button></div><small>Enter your new password to change your password.</small></div>
          <div><button class="btn pri sq" data-act="toast" data-msg="Password updated">Update Password</button></div></div></section>
      <section class="set-sec" id="passkeys"><h2>Passkeys</h2><p>Sign in with Face ID, Touch ID or a security key instead of a password.</p>
        <div class="panel" style="max-width:40rem;padding:0 1rem"><div class="srow"><div class="lbl"><b>MacBook Pro</b><small>Added 2 Oct 2026 · Last used today</small></div><button class="btn ghost" data-act="toast" data-msg="Passkey removed">Remove</button></div></div>
        <div><button class="btn sq" data-act="toast" data-msg="Follow your browser prompt to add a passkey">${icon("plus")} Add passkey</button></div></section>
      <section class="set-sec" id="delete"><h2>Delete Account</h2><p>Permanently delete your account, playlists and listening history. This cannot be undone.</p><div><button class="btn danger sq" data-act="delacct">${icon("trash")} Delete Account</button></div></section>`;
  } else if (page === "appearance") {
    const custom = !MOCK.themes.some(([, c]) => c === p.accent);
    body = `<div class="appear"><div class="set-body">
      <section class="set-sec" id="mode"><h2>Theme Mode</h2><p>Choose how Infinitunes looks to you.</p><div class="opts">${[["light", "sun", "Light"], ["dark", "moon", "Dark"], ["system", "monitor", "System"]].map(([v, ic, l]) => opt(p.mode === v, "pref-mode", v, l, icon(ic))).join("")}</div></section>
      <section class="set-sec" id="accent"><h2>Accent Color</h2><p>Used for buttons, active states, progress and highlights.</p>
        <div class="swatches">${MOCK.themes.map(([n, c]) => `<button class="swatch${p.accent === c ? " on" : ""}" style="--c:${c}" data-act="pref-accent" data-v="${c}" aria-label="${n}" title="${n[0].toUpperCase() + n.slice(1)}"></button>`).join("")}
          <label class="swatch custom${custom ? " on" : ""}" style="--c:${p.accent}" title="Custom color"><input type="color" value="${p.accent}" data-input="accent" aria-label="Custom accent color"></label>
          <span class="mono muted" style="margin-left:0.25rem">${p.accent.toUpperCase()}</span></div></section>
      <section class="set-sec" id="radius"><h2>Radius</h2><p>Roundness of cards, buttons and sheets.</p>
        <div class="opts">${RADII.map(([l, v]) => `<button class="opt${p.radius === v ? " on" : ""}" data-act="pref-radius" data-v="${v}" style="border-radius:${v}px">${l}</button>`).join("")}</div>
        <div class="range-row"><input type="range" min="0" max="24" step="1" value="${p.radius}" data-input="radius" aria-label="Corner radius"><output>${p.radius}px</output></div></section>
      <section class="set-sec" id="type"><h2>Typography</h2><p>Fonts for the interface and for headings, plus text size. Rounded and Serif use the system faces in Safari; the app would ship web fonts so every browser matches.</p>
        <div class="srow stack"><div class="lbl" style="margin-bottom:0.5rem"><b>Interface font</b></div><div class="opts">${Object.entries(FONTS).map(([k, [l, f]]) => `<button class="opt fontopt${p.font === k ? " on" : ""}" data-act="pref-font" data-v="${k}"><b style="font-family:${esc(f)}">Aa</b><small>${l}</small></button>`).join("")}</div></div>
        <div class="srow stack"><div class="lbl" style="margin-bottom:0.5rem"><b>Heading font</b></div><div class="opts">${Object.entries(FONTS).map(([k, [l, f]]) => `<button class="opt fontopt${p.head === k ? " on" : ""}" data-act="pref-head" data-v="${k}"><b style="font-family:${esc(f)}">Ag</b><small>${l}</small></button>`).join("")}</div></div>
        <div class="srow stack"><div class="lbl" style="margin-bottom:0.5rem"><b>Text size</b><small>Layout and controls scale with the text.</small></div><div class="opts">${[[15, "Small"], [16, "Default"], [17, "Large"], [18, "Larger"]].map(([v, l]) => opt(p.size === v, "pref-size", v, l)).join("")}</div></div></section>
      <section class="set-sec" id="density"><h2>Density</h2><p>Comfortable rows with artwork, or a compact table with an album column.</p><div class="opts">${opt(p.density === "comfortable", "pref-density", "comfortable", "Comfortable", icon("rows"))}${opt(p.density === "compact", "pref-density", "compact", "Compact", icon("layout"))}</div></section>
      <section class="set-sec" id="material"><h2>Glass and motion</h2><p>Liquid Glass lets artwork glow through toolbars, the player and sheets.</p>
        <div class="opts">${opt(p.glass === "liquid", "pref-glass", "liquid", "Liquid glass", icon("layers"))}${opt(p.glass === "subtle", "pref-glass", "subtle", "Subtle")}${opt(p.glass === "off", "pref-glass", "off", "Solid")}</div>
        ${window.Glass ? Glass.settingsPanel() : ""}
        <div style="max-width:40rem">
        <div class="srow"><div class="lbl"><b>Reduce motion</b><small>Replace springs and slides with simple fades. Follows your system setting automatically.</small></div>${sw(p.motion, "pref-motion", "Reduce motion")}</div></div></section>
      <div><button class="btn sq" data-act="pref-reset">${icon("refresh")} Reset to defaults</button></div>
    </div>
    <aside class="preview" aria-label="Preview"><img src="${src(S.now.i, 500)}" alt="">
      <div class="glass" style="display:flex;align-items:center;gap:0.75rem"><img src="${src(S.now.i)}" alt="" style="width:2.5rem;height:2.5rem;border-radius:var(--r-sm)"><div style="flex:1;min-width:0"><b class="ell" style="display:block">${esc(S.now.t)}</b><small class="muted">${esc(S.now.a)}</small></div><span class="ib" style="background:var(--accent);color:var(--on-accent)">${icon("play")}</span></div>
      <div class="glass" style="display:grid;gap:0.75rem"><h3 class="t-sub">Heading preview</h3><span class="muted">Body text at the current size.</span><div style="display:flex;gap:0.5rem;flex-wrap:wrap"><span class="btn pri">Primary</span><span class="btn">Secondary</span><span class="chip on">Chip</span></div></div></aside></div>`;
  } else {
    const q = (id, label, key, list, help) => `<div class="srow" id="${id}"><div class="lbl"><b>${label}</b><small>${help}</small></div><select class="input" data-input="${key}" aria-label="${label}">${list.map((v) => `<option${S[key] === v ? " selected" : ""}>${v}</option>`).join("")}</select></div>`;
    body = `<section class="set-sec" id="language"><h2>Languages</h2><p>Pick the languages you want on Home, Charts and New releases.</p>
        <div class="opts">${MOCK.languages.map((l) => opt(S.langs.has(l.toLowerCase()), "lang", l.toLowerCase(), l, S.langs.has(l.toLowerCase()) ? icon("check") : "")).join("")}</div>
        <div><button class="btn pri sq" data-act="toast" data-msg="Preferences saved">Save Preferences</button></div></section>
      <section class="set-sec"><h2>Quality Settings</h2><div>${q("stream", "Stream Quality", "stream", MOCK.qualities.stream, "Higher quality uses more data.")}${q("download-q", "Download Quality", "download", MOCK.qualities.stream, "Used for every download.")}${q("image-q", "Image Quality", "image", MOCK.qualities.image, "Artwork resolution across the app.")}</div></section>
      <section class="set-sec" id="keyboard"><h2>Keyboard</h2><div><div class="srow"><div class="lbl"><b>Keyboard shortcuts</b><small>Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume.</small></div>${sw(S.keys, "keys", "Keyboard shortcuts")}</div></div>
        <button class="btn sq" data-act="shortcuts" style="justify-self:start">${icon("keyboard")} View all shortcuts</button></section>`;
  }
  return ["Settings", `<div class="phead"><div><h1 class="ptitle">Settings</h1><p class="psub">Manage your account, appearance, and preference settings.</p></div></div><div class="set">${nav}<div class="set-body">${body}</div></div>`];
}

/* Auth: full page when opened directly, dialog when opened from inside the app (like the @modal intercepting routes). */
function authCard(kind, inDialog) {
  const oauth = `<div class="alt"><button class="btn sq" data-act="authdone">${icon("github")} GitHub</button><button class="btn sq" data-act="authdone"><b>G</b> Google</button></div>`;
  const pw = (id, l, help = "", forgot = false) => `<div class="field"><div style="display:flex;justify-content:space-between"><label for="${id}">${l}</label>${forgot ? `<a class="link" data-go="forgot-password">Forgot password?</a>` : ""}</div><div class="pw"><input id="${id}" class="input" type="password" autocomplete="current-password"><button class="ib" data-act="peek" aria-label="Show password">${icon("eye")}</button></div>${help ? `<small>${help}</small>` : ""}</div>`;
  const email = `<div class="field"><label for="a-mail">Email</label><input id="a-mail" class="input" type="email" placeholder="name@example.com" autocomplete="email"></div>`;
  const c = {
    login: ["Welcome back", "Log in to sync your library across devices.", `<button class="btn lg sq block" data-act="authdone">${icon("key")} Sign in with passkey</button>${oauth}<div class="or">or</div>${email}${pw("a-pw", "Password", "", true)}<button class="btn pri lg sq block" data-act="authdone">Login with Email</button>`, `Don't have an account? <a class="link" data-go="signup">Sign up</a>`],
    signup: ["Create your account", "Free forever. No credit card needed.", `${oauth}<div class="or">or</div>${email}${pw("a-pw", "Password", "At least 8 characters with upper and lower case, a number and a symbol.")}${pw("a-pw2", "Confirm password")}<button class="btn pri lg sq block" data-act="authdone">Sign Up</button>`, `Already have an account? <a class="link" data-go="login">Log in</a>`],
    "forgot-password": ["Forgot password", "We will email you a link to reset it.", `${email}<button class="btn pri lg sq block" data-act="toast" data-msg="Reset link sent">Send reset link</button>`, `<a class="link" data-go="login">Back to log in</a>`],
    "reset-password": ["Reset password", "Choose a new password for your account.", `${pw("a-pw", "New password", "At least 8 characters.")}${pw("a-pw2", "Confirm password")}<button class="btn pri lg sq block" data-act="authdone">Reset password</button>`, `<a class="link" data-go="login">Back to log in</a>`],
  }[kind];
  return `<div class="auth-card">${inDialog ? "" : `<a class="logo" data-go="home" style="padding:0;margin-bottom:0.5rem"><i>${icon("music")}</i><span>infinitunes</span></a>`}<div><h1>${c[0]}</h1><p class="muted" style="margin:0.25rem 0 0">${c[1]}</p></div>${c[2]}<p class="fine">${c[3]}</p>${kind === "signup" ? `<p class="fine">By continuing you agree to the <a class="link" data-go="terms">Terms</a> and <a class="link" data-go="privacy">Privacy Policy</a>.</p>` : ""}</div>`;
}
function authPage(kind) {
  const imgs = [...MOCK.playlists.slice(0, 6).map((p) => p.img), ...MOCK.albums.slice(0, 6).map((a) => a.img)];
  return ["Log in", `<div class="auth"><div class="auth-art">${imgs.map((i) => `<img src="${src(i, 500)}" alt="">`).join("")}<div class="over"><h2>Millions of songs.<br>Zero cost.</h2><p>Stream Hindi, English, Punjabi and more, in up to 320kbps.</p></div></div>
    <div class="auth-form"><button class="ib auth-close" data-act="authclose" aria-label="Close">${icon("x")}</button>${authCard(kind)}</div></div>`];
}

const prose = (t, secs) => [t, `<div class="phead"><div><h1 class="ptitle">${t}</h1><p class="psub">Last updated 1 October 2026</p></div></div><div class="prose">${secs.map((s) => `<h2>${s}</h2><p>Placeholder legal copy for the mockup. The real page renders the full ${t.toLowerCase()} text with the same heading rhythm and a readable 42rem measure.</p>`).join("")}</div>`];
const notFound = () => ["Not found", `<div class="empty" style="margin-top:2rem;padding:4rem 1rem"><div class="t-display-xl" style="background:linear-gradient(135deg,var(--accent),var(--text));-webkit-background-clip:text;background-clip:text;color:transparent">404</div><h3 class="t-section">This page took a wrong turn</h3><p>The link may be broken, or the page may have moved.</p><div class="actions" style="margin:0"><button class="btn pri" data-go="home">${icon("home")} Go home</button><button class="btn" data-act="palette">${icon("search")} Search</button></div></div>`];

function states() {
  const sk = (n) => `<div class="grid">${Array.from({ length: n }, () => `<div class="card"><div class="art skel" style="box-shadow:none"></div><div class="skel" style="height:0.75rem;width:80%"></div><div class="skel" style="height:0.5rem;width:50%"></div></div>`).join("")}</div>`;
  const skr = `<div class="tl">${Array.from({ length: 4 }, () => `<div class="tr"><span class="n"><span class="skel" style="width:1rem;height:0.75rem"></span></span><span class="ti"><span class="skel" style="width:var(--art);height:var(--art)"></span><span style="display:grid;gap:0.5rem;flex:1"><span class="skel" style="height:0.75rem;width:60%"></span><span class="skel" style="height:0.5rem;width:30%"></span></span></span><span class="ar"><span class="skel" style="height:0.75rem;width:70%;display:block"></span></span><span class="t-al"></span><span class="du"></span><span></span></div>`).join("")}</div>`;
  return ["States and dialogs", `<div class="phead"><div><h1 class="ptitle">States and dialogs</h1><p class="psub">Every loading, empty, error and overlay pattern in one place, for review.</p></div></div>
    <section class="sec"><div class="sec-h"><h2>Overlays</h2></div><div class="chips" style="flex-wrap:wrap">
      ${[["newpl", "Create playlist"], ["addto", "Add to playlist"], ["more-demo", "Song menu"], ["share", "Share"], ["langs", "Language picker"], ["user", "User menu"], ["palette", "Search palette"], ["shortcuts", "Keyboard shortcuts"], ["delacct", "Confirm dialog"], ["np", "Now playing"], ["queue", "Queue"]].map(([a, l]) => `<button class="chip" data-act="${a}" data-id="mj-8">${l}</button>`).join("")}
      <button class="chip" data-act="toast" data-msg="Added to queue">Toast</button><button class="chip" data-go="login">Login dialog</button></div></section>
    <section class="sec"><div class="sec-h"><h2>Loading</h2></div>${sk(6)}<div style="margin-top:1.5rem">${skr}</div></section>
    <section class="sec"><div class="sec-h"><h2>Empty</h2></div>${empty("listmusic", "Create your first playlist", "Collect songs you love into playlists you can play any time.", `<button class="btn pri" data-act="newpl">${icon("plus")} Create Playlist</button>`)}</section>
    <section class="sec" id="err"><div class="sec-h"><h2>Error</h2></div><div class="empty"><div class="ic err">${icon("alert")}</div><h3>Something went wrong</h3><p>We could not load this section. Check your connection and try again.</p><button class="btn" data-act="retry">${icon("refresh")} Retry</button></div></section>`];
}

const MAP = [
  ["home", "app/(root)/page.tsx", "Hero, Jump back in, shelves, Surprise me"],
  ["browse", "app/(root)/browse/page.tsx", "Category and language tiles"],
  ["albums, albums/<lang>", "app/(root)/album/page.tsx (?lang=)", "Grid or list toggle, language chips"],
  ["chart", "app/(root)/chart/page.tsx", "Ranked chart cards + top songs"],
  ["playlists, artists, radio, shows", "app/(root)/{playlist,artist,radio,show}/page.tsx", "Catalog grids"],
  ["album/<id>", "app/(root)/album/[name]/[token]/page.tsx", "components/details-header, song-list"],
  ["playlist/<id>", "app/(root)/playlist/[name]/[token]/page.tsx", "Same header + list"],
  ["mix/<id>", "app/(root)/mix/[name]/[token]/page.tsx", "Playlist layout, kind Mix"],
  ["song/<id>", "app/(root)/song/[name]/[token]/page.tsx", "Lyrics panel, details, more from album"],
  ["artist/<id>", "app/(root)/artist/[name]/[token]/page.tsx", "Tabs, sort songs, follow"],
  ["label/<id>", "app/(root)/label/[name]/[token]/page.tsx", "Label header + tabs"],
  ["radio/<id>", "app/(root)/radio/[name]/[token]/page.tsx", "Play Radio"],
  ["show/<id>", "app/(root)/show/[name]/[season]/[token]/page.tsx", "Season select, episodes"],
  ["episode/<id>", "app/(root)/episode/[name]/[token]/page.tsx", "Episode details"],
  ["search", "app/(root)/search/page.tsx", "Recent + top searches, browse"],
  ["search/<q>, search/<type>/<q>", "app/(root)/search/[type]/[query]/page.tsx", "All + type chips"],
  ["⌘K palette", "components/search/search-menu.tsx", "Live results, recents, quick actions"],
  ["me, me/<tab>", "app/(root)/me/(layout-a)/*", "Profile header, library tabs, empty states"],
  ["me/playlist/<id>", "app/(root)/me/playlist/[id]/page.tsx", "Collage cover, rename, delete, remove song"],
  ["settings", "app/(root)/settings/page.tsx", "Profile, password, passkeys, delete"],
  ["settings/appearance", "app/(root)/settings/appearance/page.tsx", "Theme customizer: mode, accent, radius, fonts, size, density, glass"],
  ["settings/preferences", "app/(root)/settings/preferences/page.tsx", "Languages, quality, keyboard"],
  ["login, signup, forgot-password, reset-password", "app/(auth)/* and app/@modal/(.)*", "Full page direct, dialog when opened in-app"],
  ["privacy, terms", "app/(root)/{privacy,terms}/page.tsx", "Prose layout"],
  ["404", "app/not-found.tsx, app/@modal/[...catchAll]", "Not found"],
  ["states", "loading.tsx, error.tsx, components/skeletons, library/retry-button", "Loading, empty, error, toasts"],
  ["Player bar / pill", "components/player.tsx, player-wrapper.tsx", "Floating glass, mini pill on phones"],
  ["Now playing", "components/expanded-player.tsx", "Drag down to dismiss on phones"],
  ["Queue", "components/queue.tsx", "Pane at 1440px+, floating panel below"],
  ["Song / entity menus", "components/song-list/more-button.tsx, details-header/more-button.tsx, share-submenu.tsx", "Anchored menu, sheet on phones"],
  ["Playlist dialogs", "components/playlist/*", "Create, add to, rename, manage"],
  ["Sidebar / rail / tab bar", "components/sidebar.tsx, site-header/mobile-nav.tsx", "Sidebar 1024+, rail 768+, dock below"],
  ["Header", "components/site-header/navbar.tsx, language-picker.tsx, user-dropdown.tsx", "Glass toolbar, collapses large titles"],
  ["Footer", "components/site-footer/footer.tsx, theme-toggle-group.tsx", "Links + theme toggle"],
];
const TOKENS = [["--accent / --on-accent", "Accent color and readable text on it"], ["--r, --r-sm, --r-lg", "Radius scale from one value"], ["--font, --font-head", "Interface and heading font stacks"], ["--base", "Root size; controls and spacing scale in rem"], ["--row, --art", "Density (row height, artwork size)"], ["--glass, --glass-heavy, --blur, --glass-edge", "Liquid Glass material"], ["--ctl, --ctl-lg", "Control heights: 32/36px pointer, 40/44px touch"], ["--ambient", "Artwork glow strength"]];
function map() {
  return ["Route map", `<div class="phead"><div><h1 class="ptitle">Route map</h1><p class="psub">Every mockup screen and component, mapped to the app source it replaces.</p></div></div>
    <div class="tblwrap"><table class="maptbl"><thead><tr><th>Mockup route</th><th>App source</th><th>Notes</th></tr></thead><tbody>${MAP.map(([r, f, n]) => `<tr><td>${/^[a-z]/.test(r) && !r.includes(" ") ? `<a class="link" data-go="${r.split(/[,<]/)[0].trim().replace(/\/$/, "")}">${esc(r)}</a>` : esc(r)}</td><td><code>${esc(f)}</code></td><td class="muted">${esc(n)}</td></tr>`).join("")}</tbody></table></div>
    <section class="sec"><div class="sec-h"><h2>Design tokens</h2></div><div class="tblwrap"><table class="maptbl"><tbody>${TOKENS.map(([t, d]) => `<tr><td><code>${t}</code></td><td class="muted">${d}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="sec"><div class="sec-h"><h2>Breakpoints</h2></div><div class="tblwrap"><table class="maptbl"><tbody>
      <tr><td>&lt; 768px</td><td class="muted">Glass top bar, floating dock + player pill, menus and dialogs become drag-to-dismiss sheets</td></tr>
      <tr><td>768 - 1023px</td><td class="muted">Icon rail, floating player</td></tr>
      <tr><td>1024 - 1439px</td><td class="muted">Labeled sidebar, queue as floating glass panel</td></tr>
      <tr><td>1440px +</td><td class="muted">Sidebar + docked queue pane</td></tr>
      <tr><td>1920px +</td><td class="muted">Wider sidebar and queue, larger cards</td></tr></tbody></table></div></section>`];
}

function footer() {
  const m = S.prefs.mode;
  return `<footer class="foot-links"><span>© 2026 Infinitunes</span><nav><a data-go="privacy">Privacy</a><a data-go="terms">Terms</a><a href="https://github.com/rajput-hemant/infinitunes" target="_blank" rel="noopener">GitHub</a><a data-go="map">Route map</a><a data-go="states">States</a><a href="../index.html">All variants</a></nav>
    <div class="seg" role="group" aria-label="Theme">${[["light", "sun", "Toggle Light Mode"], ["dark", "moon", "Toggle Dark Mode"], ["system", "monitor", "Toggle System Mode"]].map(([v, ic, l]) => `<button class="${m === v ? "on" : ""}" data-act="pref-mode" data-v="${v}" aria-label="${l}">${icon(ic)}</button>`).join("")}</div></footer>`;
}

/* ---------- Shell: sidebar, toolbar, tab bar, player, queue ---------- */
const NAV = [["home", "home", "Home"], ["browse", "compass", "Browse"], ["chart", "chart", "Top Charts"], ["albums", "disc", "Top Albums"], ["playlists", "listmusic", "Top Playlists"], ["artists", "mic", "Top Artists"], ["shows", "headphones", "Podcasts"], ["radio", "radio", "Radio"]];
const LIB = [["me/recently-played", "clock", "Recently Played"], ["me/liked-songs", "heart", "Liked Songs"], ["me", "library", "Library"]];
function renderSide(path) {
  const on = (p) => (path === p || (p !== "home" && p !== "me" && path.startsWith(p + "/")) || (p === "me" && /^me(\/(albums|playlists|artists|shows))?$/.test(path)) ? " on" : "");
  $("#side").innerHTML = `<a class="logo" data-go="home"><i>${icon("music")}</i><span>infinitunes</span></a>
    <nav class="nav">${NAV.map(([p, ic, l]) => `<a class="${on(p)}" data-go="${p}" title="${l}">${icon(ic)}<span>${l}</span></a>`).join("")}</nav>
    <nav class="nav"><div class="nav-h">Library</div>${LIB.map(([p, ic, l]) => `<a class="${on(p)}" data-go="${p}" title="${l}">${icon(ic)}<span>${l}</span></a>`).join("")}</nav>
    <nav class="nav pls"><div class="nav-h">Playlists <button class="ib xs" data-act="newpl" aria-label="Create Playlist">${icon("plus")}</button></div>${S.playlists.map((p) => `<a class="${on("me/playlist/" + p.id)}" data-go="me/playlist/${p.id}"><img src="${src(plSongs(p)[0]?.i || ALB.img)}" alt=""><span>${esc(p.name)}</span></a>`).join("")}</nav>
    <div class="side-foot"><a data-go="map">Route map</a><a data-go="states">States</a><a href="../index.html">All variants</a></div>`;
}
const ROOTS = ["home", "search", "browse", "me", "settings"];
function renderBar(r, title) {
  const root = ROOTS.includes(r.path) || r.path === "";
  const bar = $("#bar");
  bar.classList.toggle("has-back", !root);
  bar.innerHTML = `<button class="ib back" data-back aria-label="Back">${icon("left")}</button>
    <a class="logo mlogo" data-go="home"><i>${icon("music")}</i><span>infinitunes</span></a>
    <div class="nav-arrows"><button class="ib" data-back aria-label="Back">${icon("left")}</button><button class="ib" data-act="fwd" aria-label="Forward">${icon("right")}</button></div>
    <div class="title grow">${esc(title)}</div>
    <button class="searchbox" data-act="palette" aria-label="Search">${icon("search")}<span>Search</span><kbd>⌘K</kbd></button>
    <div class="tb-group"><button class="btn ghost lang-btn" data-act="langs" aria-label="Choose languages">${icon("langs")}<span>${S.langs.size} languages</span></button>
    ${S.loggedIn ? `<button class="ib" data-act="user" aria-label="Open user menu"><span class="avatar sm">${esc(S.user.name[0])}</span></button>` : ""}</div>${S.loggedIn ? "" : `<button class="btn pri" data-go="login">Log in</button>`}`;
}
function renderTabbar(path) {
  const t = [["home", "home", "Home"], ["search", "search", "Search"], ["browse", "compass", "Browse"], ["me", "library", "Library"], ["settings", "settings", "Settings"]];
  $("#tabbar").innerHTML = t.map(([p, ic, l]) => `<a class="${path === p || path.startsWith(p + "/") ? "on" : ""}" data-go="${p}">${icon(ic)}<span>${l}</span></a>`).join("");
}
function renderPlayer() {
  const s = S.now, rep = ["repeat", "repeat", "repeat1"][S.repeat];
  $("#player").innerHTML = `<div class="pl-now" data-act="np" role="button" aria-label="Open player"><img src="${src(s.i)}" alt=""><div class="ell"><b class="ell">${esc(s.t)}</b><small class="ell">${esc(s.a)}</small></div></div>
    <div class="pl-mid"><div class="pl-ctl">
      <button class="ib dot${S.shuffle ? " on" : ""}" data-act="shuffle" aria-label="Shuffle">${icon("shuffle")}</button>
      <button class="ib" data-act="prev" aria-label="Previous">${icon("prev")}</button>
      <button class="ib big" data-act="toggle" aria-label="${S.playing ? "Pause" : "Play"}">${icon(S.playing ? "pause" : "play")}</button>
      <button class="ib" data-act="next" aria-label="Next">${icon("next")}</button>
      <button class="ib dot${S.repeat ? " on" : ""}" data-act="repeat" aria-label="Loop">${icon(rep)}</button></div>
      <div class="scrub"><span class="t-cur">${fmt(S.pos)}</span><div class="track" data-scrub tabindex="0" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="${secs(s.d)}" aria-valuenow="${Math.round(S.pos)}" aria-valuetext="${fmt(S.pos)}"><div class="fill"></div></div><span>${s.d}</span></div></div>
    <div class="pl-right">
      <button class="ib like hide-m${S.liked.has(s.id) ? " on" : ""}" data-act="like" data-id="${s.id}" aria-label="Like">${icon("heart", "fill")}</button>
      <button class="ib hide-m${S.qOpen ? " on" : ""}" data-act="queue" aria-label="Open queue">${icon("queue")}</button>
      <button class="ib hide-m" data-act="mute" aria-label="${S.muted ? "Unmute" : "Mute"}">${icon(S.muted || !S.vol ? "mute" : "vol")}</button>
      <input class="vol hide-m" type="range" min="0" max="1" step="0.01" value="${S.muted ? 0 : S.vol}" data-input="vol" aria-label="Volume">
      <button class="ib hide-m" data-act="np" aria-label="Expand player">${icon("expand")}</button>
      <button class="ib show-m big-m" data-act="toggle" aria-label="${S.playing ? "Pause" : "Play"}">${icon(S.playing ? "pause" : "play")}</button>
      <button class="ib show-m" data-act="next" aria-label="Next">${icon("next")}</button></div>
    <div class="pl-mini-prog"><i></i></div>`;
  $("#ambient img").src = src(s.i, 500);
  progress();
  if ($(".np")) renderNP();
}
function progress() {
  const pct = (S.pos / secs(S.now.d)) * 100 + "%";
  $$(".track .fill").forEach((f) => (f.style.width = pct));
  $$(".pl-mini-prog i").forEach((f) => (f.style.width = pct));
  $$(".t-cur").forEach((t) => (t.textContent = fmt(S.pos)));
  $$(".track[data-scrub]").forEach((t) => { t.setAttribute("aria-valuenow", Math.round(S.pos)); t.setAttribute("aria-valuetext", fmt(S.pos)); });
}
function renderQueue() {
  const q = S.queue;
  $("#qpane").innerHTML = `<div class="q-head">Queue<button class="ib" data-act="queue" aria-label="Close">${icon("x")}</button></div>
    <div class="q-body"><div class="q-now"><img class="q-big" src="${src(S.now.i, 500)}" alt=""></div>
      <div class="q-label">Now playing</div>${qrow(S.now, -1)}
      <div class="q-label">Up next <button class="link" data-act="clearq">Clear</button></div>${q.length ? q.map(qrow).join("") : `<p class="muted" style="padding:0 0.5rem">Nothing queued. Autoplay continues with similar songs.</p>`}
      <div class="q-label">Autoplay</div>${NEW.slice(5, 9).map((s) => qrow(s, -2)).join("")}</div>`;
}
const qrow = (s, k) => `<div class="qrow" data-act="${k >= 0 ? "playq" : k === -2 ? "playone" : ""}" data-k="${k}" data-id="${s.id}"><img src="${src(s.i)}" alt=""><div class="ell"><b class="ell">${k === -1 && S.playing ? EQ + " " : ""}${esc(s.t)}</b><small class="ell">${esc(s.a)}</small></div>${k >= 0 ? `<button class="ib" data-act="rmq" data-k="${k}" aria-label="Remove from queue">${icon("x")}</button>` : `<span class="muted t-caption">${s.d}</span>`}</div>`;

/* ---------- Playback ---------- */
let timer;
function play(s, list) {
  if (list) { const i = list.findIndex((x) => x.id === s.id); S.queue = list.slice(i + 1); }
  S.now = s; S.pos = 0; S.playing = true;
  S.recentPlayed = [s.id, ...S.recentPlayed.filter((x) => x !== s.id)].slice(0, 20);
  tick(); renderPlayer(); renderQueue(); markRows();
}
function toggle() { S.playing = !S.playing; tick(); renderPlayer(); renderQueue(); markRows(); }
function next() {
  if (S.repeat === 2) { S.pos = 0; return; }
  const n = S.shuffle ? S.queue.splice(Math.floor(Math.random() * S.queue.length), 1)[0] : S.queue.shift();
  if (n) play(n); else { S.playing = false; S.pos = 0; tick(); renderPlayer(); markRows(); }
}
function prev() { if (S.pos > 3) { S.pos = 0; progress(); return; } const r = S.recentPlayed[1] && byId(S.recentPlayed[1]); if (r) { S.queue.unshift(S.now); play(r); } }
function tick() {
  clearInterval(timer);
  if (S.playing) timer = setInterval(() => { S.pos += 0.25; if (S.pos >= secs(S.now.d)) next(); else progress(); }, 250);
}
function markRows() {
  $$(".tr[data-id]").forEach((el) => {
    const cur = el.dataset.id === S.now.id;
    el.classList.toggle("cur", cur); el.classList.toggle("paused", cur && !S.playing);
    const em = $(".n em", el), b = $(".n .ib", el);
    if (!em || !b) return;
    const k = [...el.parentNode.children].filter((x) => x.classList.contains("tr")).indexOf(el);
    em.innerHTML = cur && S.playing ? EQ : k + 1;
    b.innerHTML = icon(cur && S.playing ? "pause" : "play");
  });
}
const playSrc = (go, shuffle) => { const l = [...songsFor(go)]; if (shuffle) l.sort(() => Math.random() - 0.5); S.shuffle = !!shuffle; play(l[0], l); toast(`Playing ${l.length} songs`, shuffle ? "shuffle" : "play"); };

/* ---------- Layers ---------- */
const layer = $("#layer");
let closing = null, sheetCtl = null;
function closeLayer(instant) {
  if (!layer.innerHTML) return;
  const panel = $(".menu,.dialog,.palette", layer);
  const done = () => { layer.innerHTML = ""; sheetCtl = null; };
  if (instant || !panel || !sheetCtl) return done();
  $(".scrim", layer)?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
  sheetCtl.leave(done);
}
function openLayer(html, { anchor, clear, kind = "menu" } = {}) {
  const host = anchor?.closest(".menu"), hostBox = host?.getBoundingClientRect(), ar = anchor?.getBoundingClientRect();
  closeLayer(true);
  if (S.qOpen && innerWidth < 1440) { S.qOpen = false; document.documentElement.classList.remove("q-open"); renderPlayer(); }
  layer.innerHTML = `<div class="scrim${clear && !isMobile() ? " clear" : ""}" data-act="close"></div>${html}`;
  const panel = $(".menu,.dialog,.palette", layer);
  panel.insertAdjacentHTML("afterbegin", '<div class="grab"></div>');
  if (hostBox && !isMobile()) {
    Object.assign(panel.style, { left: Math.min(hostBox.left, innerWidth - panel.offsetWidth - 8) + "px", top: Math.max(8, Math.min(hostBox.top, innerHeight - panel.offsetHeight - 8)) + "px" });
    panel.style.animation = "none";
  } else if (ar && kind === "menu" && !isMobile()) {
    const r = ar, w = panel.offsetWidth, h = panel.offsetHeight;
    let left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8), top = r.bottom + 6, oy = "top";
    if (top + h > innerHeight - 8) { top = Math.max(8, r.top - h - 6); oy = "bottom"; }
    const ox = r.left + r.width / 2 - left < w / 2 ? "left" : "right";
    Object.assign(panel.style, { left: left + "px", top: top + "px" });
    panel.style.setProperty("--ox", `${oy} ${ox}`);
  }
  sheetCtl = draggable(panel, () => (layer.innerHTML = ""));
  sheetCtl.enter();
  ($("input:not([type=color])", panel) || $(".mi,button", panel))?.focus({ preventScroll: true });
}
const menu = (items, head = "") => `<div class="menu glass" role="menu">${head}${items.join("")}</div>`;
const mi = (ic, label, act, data = "", cls = "") => `<button class="mi ${cls}" role="menuitem" data-act="${act}" ${data}>${icon(ic)}<span>${label}</span></button>`;
const mhead = (s) => `<div class="mh"><img src="${src(s.i || s.img)}" alt=""><div class="ell"><b class="ell">${esc(s.t || s.title)}</b><small class="ell">${esc(s.a || s.subtitle || "")}</small></div></div>`;
const SEP = '<div class="msep"></div>';

function songMenu(id, extra, anchor, sub) {
  const s = byId(id);
  if (!s) return;
  const d = `data-id="${id}" data-extra="${extra || ""}"`;
  const back = mi("left", "Back", "more", d + ' data-sub=""');
  const panels = {
    share: [back, SEP, mi("copy", "Copy Link", "toast", 'data-msg="Link copied"'), mi("at", "X/Twitter", "toast", 'data-msg="Opening X"'), mi("share", "Facebook", "toast", 'data-msg="Opening Facebook"'), mi("send", "Telegram", "toast", 'data-msg="Opening Telegram"'), mi("mail", "Email", "toast", 'data-msg="Opening mail"')],
    download: [back, SEP, ...MOCK.qualities.stream.map((q) => mi("download", q, "toast", `data-msg="Downloading ${esc(s.t)} (${q})"`, q === S.download ? "cur" : ""))],
  };
  const main = s.ep
    ? [mi("play", "Play Now", "playone", d), mi("queue", "Add to Queue", "addq", d), SEP, mi("info", "View Episode Details", "go", `data-to="episode/${id}"`), mi("share", "Share", "more", d + ' data-sub="share"')]
    : [mi("play", "Play Song Now", "playone", d), mi("queue", "Add to Queue", "addq", d), mi("listmusic", "Add To Playlist", "addto", d),
      mi("heart", S.liked.has(id) ? "Remove From Favourite" : "Add To Favourite", "like", d), SEP,
      s.alId ? mi("disc", "Go to album", "go", `data-to="album/${s.alId}"`) : "", s.arId ? mi("mic", "Go to artist", "go", `data-to="artist/${s.arId}"`) : "", mi("radio", "Play Radio", "toast", 'data-msg="Starting song radio"'),
      SEP, `<button class="mi" data-act="more" ${d} data-sub="download">${icon("download")}<span>Download</span><span class="end">${icon("right")}</span></button>`,
      `<button class="mi" data-act="more" ${d} data-sub="share">${icon("share")}<span>Share</span><span class="end">${icon("right")}</span></button>`,
      extra && extra.startsWith("pl:") ? SEP + mi("trash", "Remove from Playlist", "rmpl", d, "danger") : ""];
  openLayer(menu(sub ? panels[sub] : main, mhead(s)), { anchor, clear: true });
}
function entityMenu(go, anchor) {
  openLayer(menu([mi("play", "Play next", "toast", 'data-msg="Playing next"'), mi("queue", "Add to Queue", "toast", 'data-msg="Added to queue"'), mi("listmusic", "Add To Playlist", "addto", 'data-id="mj-0"'), SEP,
    mi("download", "Download all", "toast", `data-msg="Downloading at ${S.download}"`), mi("copy", "Copy Link", "toast", 'data-msg="Link copied"'), mi("radio", "Start radio", "toast", 'data-msg="Starting radio"')]), { anchor, clear: true });
}
function userMenu(anchor) {
  const m = S.prefs.mode;
  openLayer(menu([mi("library", "Library", "go", 'data-to="me"'), mi("heart", "Liked Songs", "go", 'data-to="me/liked-songs"'), mi("settings", "Settings", "go", 'data-to="settings"'), mi("palette", "Appearance", "go", 'data-to="settings/appearance"'), SEP,
    `<div class="mpad"><div class="seg" style="width:100%;display:flex">${[["light", "sun"], ["dark", "moon"], ["system", "monitor"]].map(([v, ic]) => `<button style="flex:1" class="${m === v ? "on" : ""}" data-act="pref-mode" data-v="${v}" aria-label="${v} mode">${icon(ic)}</button>`).join("")}</div></div>`,
    mi("keyboard", "Keyboard shortcuts", "shortcuts"), SEP, mi("logout", "Log out", "logout", "", "danger")],
    `<div class="mh"><span class="avatar sm" style="width:2.5rem;height:2.5rem">${esc(S.user.name[0])}</span><div class="ell"><b>${esc(S.user.name)}</b><small>${esc(S.user.email)}</small></div></div>`), { anchor, clear: true });
}
function langMenu(anchor) {
  openLayer(`<div class="menu glass" style="width:20rem"><div class="mpad"><b>Languages</b><p class="muted t-caption" style="margin:0.125rem 0 0.5rem">Shapes Home, Charts and New releases.</p>
    <div class="opts">${MOCK.languages.map((l) => `<button class="chip${S.langs.has(l.toLowerCase()) ? " on" : ""}" data-act="lang" data-v="${l.toLowerCase()}">${l}</button>`).join("")}</div>
    <button class="btn pri sq block" style="margin-top:0.75rem" data-act="langsave">Save</button></div></div>`, { anchor, clear: true });
}
function dialog(title, desc, body, foot, wide) {
  openLayer(`<div class="dialog glass${wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${title}</h2>${desc ? `<p class="desc">${desc}</p>` : ""}${body}${foot ? `<div class="foot">${foot}</div>` : ""}</div>`, { kind: "dialog" });
}
const cancel = '<button class="btn" data-act="close">Cancel</button>';
function newPlaylist(add) {
  dialog("Create New Playlist", "Give it a name. You can add a description later.", `<div style="display:grid;gap:1rem"><div class="field"><label for="pl-name">Name</label><input id="pl-name" class="input" placeholder="Enter playlist name"></div><div class="field"><label for="pl-desc">Description</label><textarea id="pl-desc" class="input" placeholder="Enter playlist description"></textarea></div></div>`,
    `${cancel}<button class="btn pri" data-act="createpl" data-id="${add || ""}">Create</button>`);
}
function addTo(id) {
  dialog("Add To Playlist", esc(byId(id)?.t || ""), `<div style="display:grid;gap:0.25rem;margin:0 -0.5rem">${S.playlists.map((p) => `<button class="prow" data-act="addtopl" data-pl="${p.id}" data-id="${id}"><img src="${src(plSongs(p)[0]?.i || ALB.img)}" alt=""><div><b>${esc(p.name)}</b><small>${p.songs.length} songs</small></div>${p.songs.includes(id) ? `<span class="muted" style="margin-left:auto">${icon("check")}</span>` : ""}</button>`).join("")}
    <button class="prow" data-act="newpl" data-id="${id}"><span class="ic">${icon("plus")}</span><b>New playlist</b></button></div>`, cancel);
}
function shortcuts() {
  const k = [["Space", "Play or pause"], ["N", "Next track"], ["P", "Previous track"], ["L", "Like current song"], ["S", "Shuffle"], ["Shift + Left / Right", "Previous / next track"], ["Shift + Up / Down", "Volume"], ["⌘K or /", "Search"], ["Esc", "Close"]];
  dialog("Keyboard shortcuts", "", `<dl class="kv" style="gap:0.75rem 1.5rem">${k.map(([a, b]) => `<dt>${a.split(" ").map((x) => (x.length > 1 && /[a-z]/i.test(x) && !["or", "Left", "Right", "Up", "Down"].includes(x)) || x.length === 1 || x === "Space" || x === "Shift" || x === "Esc" || x === "⌘K" ? `<kbd>${x}</kbd>` : x).join(" ")}</dt><dd>${b}</dd>`).join("")}</dl>`, '<button class="btn pri" data-act="close">Done</button>');
}

/* ⌘K palette with live results and keyboard navigation. */
function palette() {
  openLayer(`<div class="palette glass" role="dialog" aria-label="Search"><div class="pin">${icon("search")}<input placeholder="Search songs, albums, artists, podcasts" data-input="pal" aria-label="Search"><button class="ib" data-act="close" aria-label="Close">${icon("x")}</button></div><div class="pbody"></div>
    <div class="pfoot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>`, { kind: "palette" });
  palResults("");
}
function palResults(q) {
  const l = q.trim().toLowerCase(), body = $(".pbody");
  if (!body) return;
  const pr = (go, img, t, sub, round, ic) => `<button class="prow" data-act="go" data-to="${go}" data-q="${esc(q)}">${img ? `<img class="${round ? "round" : ""}" src="${src(img)}" alt="">` : `<span class="ic">${icon(ic)}</span>`}<div class="ell"><b class="ell">${esc(t)}</b><small>${esc(sub)}</small></div></button>`;
  if (!l) {
    body.innerHTML = (S.recentSearches.length ? `<div class="q-label">Recent searches</div>${S.recentSearches.map((r) => pr("search/" + encodeURIComponent(r), "", r, "Search", false, "clock")).join("")}` : "")
      + `<div class="q-label">Trending</div>${NEW.slice(0, 4).map((s) => pr("song/" + s.id, s.i, s.t, "Song · " + s.a)).join("")}`
      + `<div class="q-label">Go to</div>${pr("chart", "", "Top Charts", "Page", 0, "chart")}${pr("me", "", "Library", "Page", 0, "library")}${pr("settings/appearance", "", "Appearance", "Settings", 0, "palette")}`;
  } else {
    const { r, none } = results(l);
    body.innerHTML = (none ? `<p class="muted" style="padding:0.5rem 0.625rem;margin:0">No matches for "${esc(q)}". Popular right now:</p>` : "")
      + pr("search/" + encodeURIComponent(q), "", `Search for "${q}"`, "See all results", 0, "search")
      + (r.songs.length ? `<div class="q-label">Songs</div>${r.songs.slice(0, 4).map((s) => pr("song/" + s.id, s.i, s.t, s.a)).join("")}` : "")
      + (r.artists.length ? `<div class="q-label">Artists</div>${r.artists.slice(0, 3).map((a) => pr("artist/" + a.id, a.img, a.name, "Artist", true)).join("")}` : "")
      + (r.albums.length ? `<div class="q-label">Albums</div>${r.albums.slice(0, 3).map((a) => pr("album/" + a.id, a.img, a.title, "Album · " + a.subtitle)).join("")}` : "")
      + (r.playlists.length ? `<div class="q-label">Playlists</div>${r.playlists.slice(0, 3).map((p) => pr("playlist/" + p.id, p.img, p.title, "Playlist")).join("")}` : "");
  }
  $$(".prow", body)[0]?.classList.add("sel");
}

/* Now Playing: full-screen, artwork-lit, drag down to dismiss on phones. */
let npCtl = null;
function openNP() {
  closeLayer(true);
  const el = document.createElement("div");
  el.className = "np"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Now playing");
  document.body.appendChild(el);
  renderNP();
  npCtl = draggable(el, () => { el.remove(); npCtl = null; });
  npCtl.enter();
}
function closeNP() { const el = $(".np"); if (!el) return; if (npCtl) npCtl.leave(() => { el.remove(); npCtl = null; }); else el.remove(); }
function renderNP() {
  const el = $(".np"), s = S.now, tab = S.tabs.np || "queue";
  el.classList.toggle("paused", !S.playing);
  el.innerHTML = `<div class="bgart" style="background-image:url('${src(s.i, 500)}')"></div>
    <div class="np-top"><span class="grabber"></span><button class="ib" data-act="npclose" aria-label="Close">${icon("down")}</button><small class="muted ell">Playing from <b style="color:var(--text)">${esc(s.al)}</b></small><button class="ib" data-act="more" data-id="${s.id}" aria-label="More options">${icon("more")}</button></div>
    <div class="np-in"><div class="np-left"><img class="np-art" src="${src(s.i, 500)}" alt=""><div>
      <div class="np-meta"><div class="ell"><h2 class="ell">${esc(s.t)}</h2>${s.arId ? `<a data-go="artist/${s.arId}">${esc(s.a)}</a>` : `<span class="muted">${esc(s.a)}</span>`}</div><button class="ib like${S.liked.has(s.id) ? " on" : ""}" data-act="like" data-id="${s.id}" aria-label="Like">${icon("heart", "fill")}</button></div>
      <div class="scrub"><span class="t-cur">${fmt(S.pos)}</span><div class="track" data-scrub tabindex="0" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="${secs(s.d)}" aria-valuenow="${Math.round(S.pos)}" aria-valuetext="${fmt(S.pos)}"><div class="fill"></div></div><span>${s.d}</span></div>
      <div class="pl-ctl"><button class="ib dot${S.shuffle ? " on" : ""}" data-act="shuffle" aria-label="Shuffle">${icon("shuffle")}</button><button class="ib" data-act="prev" aria-label="Previous">${icon("prev")}</button><button class="ib big" data-act="toggle" aria-label="${S.playing ? "Pause" : "Play"}">${icon(S.playing ? "pause" : "play")}</button><button class="ib" data-act="next" aria-label="Next">${icon("next")}</button><button class="ib dot${S.repeat ? " on" : ""}" data-act="repeat" aria-label="Loop">${icon(S.repeat === 2 ? "repeat1" : "repeat")}</button></div>
      <div class="np-vol"><button class="ib" data-act="mute" aria-label="Mute">${icon(S.muted ? "mute" : "vol")}</button><input type="range" min="0" max="1" step="0.01" value="${S.muted ? 0 : S.vol}" data-input="vol" aria-label="Volume"></div>
      <div class="np-vol show-m" style="justify-content:space-between"><button class="btn ghost" data-act="nptab" data-v="lyrics">${icon("lyrics")} Lyrics</button><button class="btn ghost" data-act="nptab" data-v="queue">${icon("queue")} Up next</button></div></div></div>
    <div class="np-right"><div class="seg"><button class="${tab === "queue" ? "on" : ""}" data-act="nptab" data-v="queue">Up next</button><button class="${tab === "lyrics" ? "on" : ""}" data-act="nptab" data-v="lyrics">Lyrics</button></div>
      <div class="np-scroll">${tab === "queue" ? S.queue.map(qrow).join("") || `<p class="muted">Queue is empty.</p>` : `<div class="lyrics" style="padding:0.5rem">${["Synced lyrics", "scroll here in time", "with the music.", "The current line", "is highlighted", "like this one."].map((l, k) => `<p class="${k === 4 ? "cur" : ""}">${l}</p>`).join("")}<p class="muted t-caption" style="font-weight:400">Placeholder lines, not real lyrics.</p></div>`}</div></div></div>`;
  progress();
}

function toast(msg, ic = "check") {
  const t = document.createElement("div");
  t.className = "toast glass"; t.innerHTML = icon(ic) + esc(msg);
  $("#toasts").appendChild(t);
  setTimeout(() => t.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.96)" }], { duration: 200, fill: "forwards" }).finished.then(() => t.remove()), 2200);
}

/* ---------- Render ---------- */
let pending = null, lastPath = null;
function page(r) {
  const p = r.params;
  switch (r.name) {
    case "home": return home();
    case "browse": return browse();
    case "albums": return albums(p[0]);
    case "playlists": return simplePage("Top Playlists", "Editorial playlists, updated weekly.", MOCK.playlists.map(PL));
    case "artists": return simplePage("Top Artists", "The most played artists right now.", ARTISTS.map(AR));
    case "radio": return p[0] ? station(p[0]) : simplePage("Radio", "Endless stations for every mood.", STATIONS.map(ST));
    case "shows": return simplePage("Podcasts", "Top shows across languages.", SHOWS.map(SH));
    case "chart": return chart();
    case "album": return album(p[0]);
    case "playlist": return playlist(p[0]);
    case "mix": return playlist(p[0] || MIX.id, "Mix");
    case "song": return song(p[0]);
    case "artist": return artist(p[0]);
    case "label": return label();
    case "show": return show(p[0]);
    case "episode": return episode(p[0]);
    case "search": return search(p);
    case "me": return p[0] === "playlist" ? userPlaylist(p[1]) : me(p[0] || "");
    case "settings": return settings(p[0] || "");
    case "privacy": return prose("Privacy Policy", ["Information we collect", "How we use it", "Your choices", "Contact"]);
    case "terms": return prose("Terms of Service", ["Using Infinitunes", "Content", "Accounts", "Changes"]);
    case "states": return states();
    case "map": return map();
    default: return notFound();
  }
}
const AUTH = ["login", "signup", "forgot-password", "reset-password"];
function render(r) {
  const h = document.documentElement;
  if (AUTH.includes(r.name)) {
    if (Router.depth > 0 && lastPath && !h.classList.contains("auth-page")) {
      openLayer(`<div class="dialog glass wide" role="dialog" aria-modal="true"><button class="ib" style="position:absolute;right:0.75rem;top:0.75rem" data-act="authclose" aria-label="Close">${icon("x")}</button>${authCard(r.name, true)}</div>`, { kind: "dialog" });
      return;
    }
    closeLayer(true); closeNP();
    h.classList.add("auth-page");
    $("#view").innerHTML = authPage(r.name)[1];
    document.title = "Log in | Infinitunes";
    return;
  }
  closeLayer(true);
  h.classList.remove("auth-page");
  const [title, html] = page(r);
  $("#view").innerHTML = `<div class="page">${html}${footer()}</div>`;
  document.title = `${title.replace(/<[^>]+>/g, "")} | Infinitunes`;
  renderSide(r.path); renderBar(r, title); renderTabbar(r.path);
  if (lastPath !== r.path) window.scrollTo(0, 0);
  lastPath = r.path;
  observeTitle();
  if (pending) { const el = document.getElementById(pending); pending = null; el && el.scrollIntoView({ block: "start" }); }
}
const refresh = () => { const y = scrollY; render(Router.current()); scrollTo(0, y); };

let io;
function observeTitle() {
  io && io.disconnect();
  const t = $(".ptitle, .dhead h1");
  $("#bar").classList.remove("titled");
  if (!t) return;
  io = new IntersectionObserver(([e]) => $("#bar").classList.toggle("titled", !e.isIntersecting && e.boundingClientRect.top < 60), { rootMargin: "-56px 0px 0px 0px" });
  io.observe(t);
}
addEventListener("scroll", () => $("#bar").classList.toggle("scrolled", scrollY > 4), { passive: true });

/* ---------- Events ---------- */
const ACT = {
  close: () => closeLayer(),
  go: (d) => { if (d.q) S.recentSearches = [d.q, ...S.recentSearches.filter((x) => x !== d.q)].slice(0, 6); closeLayer(true); closeNP(); Router.go(d.to); },
  fwd: () => history.forward(),
  palette: () => palette(),
  langs: (d, el) => langMenu(el),
  user: (d, el) => userMenu(el),
  lang: (d, el) => { S.langs.has(d.v) ? S.langs.delete(d.v) : S.langs.add(d.v); if (el.classList.contains("chip")) el.classList.toggle("on"); else refresh(); },
  langsave: () => { closeLayer(); toast("Languages updated"); refresh(); },
  toggle: () => toggle(), next: () => next(), prev: () => prev(),
  shuffle: () => { S.shuffle = !S.shuffle; toast(S.shuffle ? "Shuffling" : "Shuffle off", "shuffle"); renderPlayer(); },
  repeat: () => { S.repeat = (S.repeat + 1) % 3; toast(["Looping disabled", "Looping playlist", "Looping track"][S.repeat], "repeat"); renderPlayer(); },
  mute: () => { S.muted = !S.muted; renderPlayer(); },
  queue: () => { S.qOpen = !S.qOpen; document.documentElement.classList.toggle("q-open", S.qOpen); closeNP(); renderPlayer(); },
  clearq: () => { S.queue = []; renderQueue(); toast("Queue cleared"); },
  rmq: (d, el, e) => { e.stopPropagation(); S.queue.splice(+d.k, 1); renderQueue(); if ($(".np")) renderNP(); toast("Removed from queue"); },
  playq: (d) => { const s = S.queue.splice(+d.k, 1)[0]; play(s); if ($(".np")) renderNP(); },
  addq: (d) => { S.queue.unshift(byId(d.id)); renderQueue(); closeLayer(); toast("Added to queue", "queue"); },
  np: () => openNP(),
  npclose: () => closeNP(),
  nptab: (d) => { S.tabs.np = d.v; $(".np")?.classList.add("show-q"); renderNP(); },
  playrow: (d, el) => { const r = el.closest(".tr"); if (r.dataset.id === S.now.id) toggle(); else play(byId(r.dataset.id), LISTS[r.dataset.list]); },
  playone: (d) => { closeLayer(true); play(byId(d.id)); },
  playall: (d) => playSrc(d.src),
  shuffleall: (d) => playSrc(d.src, true),
  playcard: (d, el, e) => { e.stopPropagation(); playSrc(d.src); },
  "playlist-list": (d) => { const l = d.k === "recent" ? S.recentPlayed.map(byId) : [...S.liked].map(byId).filter(Boolean); play(l[0], l); },
  surprise: () => { const l = [...ALL.filter((s) => !s.ep)].sort(() => Math.random() - 0.5).slice(0, 10); play(l[0], l); toast("Added 10 songs to the queue", "sparkles"); },
  like: (d) => { const on = !S.liked.has(d.id); on ? S.liked.add(d.id) : S.liked.delete(d.id); $$(`[data-act="like"][data-id="${d.id}"]`).forEach((b) => b.classList.toggle("on", on)); closeLayer(); toast(on ? "Added to Liked Songs" : "Removed from Liked Songs", "heart"); },
  likeitem: (d) => { const on = !S.likedItems.has(d.k); on ? S.likedItems.add(d.k) : S.likedItems.delete(d.k); toast(on ? (d.k.startsWith("artist") || d.k.startsWith("show") ? "Following" : "Added to library") : "Removed from library", "heart"); refresh(); },
  more: (d, el) => songMenu(d.id, d.extra, el, d.sub),
  "more-demo": (d, el) => songMenu("mj-8", "", el),
  emore: (d, el) => entityMenu(d.src, el),
  share: (d, el) => openLayer(menu([mi("copy", "Copy Link", "toast", 'data-msg="Link copied"'), mi("at", "X/Twitter", "toast", 'data-msg="Opening X"'), mi("share", "Facebook", "toast", 'data-msg="Opening Facebook"'), mi("send", "Telegram", "toast", 'data-msg="Opening Telegram"'), mi("mail", "Email", "toast", 'data-msg="Opening mail"')]), { anchor: el, clear: true }),
  download: () => toast(`Downloading at ${S.download}`, "download"),
  addto: (d) => addTo(d.id || "mj-8"),
  addtopl: (d) => { const p = S.playlists.find((x) => x.id === d.pl); if (!p.songs.includes(d.id)) p.songs.push(d.id); closeLayer(); toast(`Added to ${p.name}`, "listmusic"); renderSide(Router.current().path); },
  newpl: (d) => newPlaylist(d.id),
  createpl: (d) => { const name = $("#pl-name").value.trim() || "My Playlist #" + (S.playlists.length + 1); const p = { id: slug(name) + "-" + Date.now().toString(36).slice(-3), name, desc: $("#pl-desc").value.trim(), songs: d.id ? [d.id] : [] }; S.playlists.push(p); closeLayer(true); toast("Playlist created", "listmusic"); Router.go("me/playlist/" + p.id); },
  plmanage: (d, el) => openLayer(menu([mi("pencil", "Rename", "rename", `data-id="${d.id}"`), mi("pencil", "Edit description", "rename", `data-id="${d.id}"`), mi("share", "Share", "toast", 'data-msg="Link copied"'), SEP, mi("trash", "Delete playlist", "delpl", `data-id="${d.id}"`, "danger")]), { anchor: el, clear: true }),
  rename: (d) => { const p = S.playlists.find((x) => x.id === d.id); dialog("Rename playlist", "", `<div style="display:grid;gap:1rem"><div class="field"><label for="pl-name">Name</label><input id="pl-name" class="input" value="${esc(p.name)}"></div><div class="field"><label for="pl-desc">Description</label><textarea id="pl-desc" class="input">${esc(p.desc)}</textarea></div></div>`, `${cancel}<button class="btn pri" data-act="saverename" data-id="${d.id}">Save</button>`); },
  saverename: (d) => { const p = S.playlists.find((x) => x.id === d.id); p.name = $("#pl-name").value.trim() || p.name; p.desc = $("#pl-desc").value.trim(); closeLayer(true); toast("Playlist updated"); refresh(); },
  delpl: (d) => { const p = S.playlists.find((x) => x.id === d.id); dialog("Delete playlist?", `"${esc(p.name)}" will be removed from your library. This cannot be undone.`, "", `${cancel}<button class="btn pri danger" data-act="confirmdel" data-id="${d.id}">Delete</button>`); },
  confirmdel: (d) => { S.playlists = S.playlists.filter((x) => x.id !== d.id); closeLayer(true); toast("Playlist deleted", "trash"); Router.go("me"); },
  rmpl: (d) => { const p = S.playlists.find((x) => "pl:" + x.id === d.extra); p.songs = p.songs.filter((x) => x !== d.id); closeLayer(true); toast(`Removed from ${p.name}`, "trash"); refresh(); },
  delacct: () => dialog("Delete account?", "Your playlists, likes and history will be permanently deleted. This cannot be undone.", "", `${cancel}<button class="btn pri danger" data-act="close">Delete Account</button>`),
  shortcuts: () => shortcuts(),
  logout: () => { S.loggedIn = false; closeLayer(true); toast("Logged out", "logout"); Router.go("login"); },
  authdone: () => { S.loggedIn = true; closeLayer(true); toast(`Welcome back, ${S.user.name}`); Router.go("home"); },
  authclose: () => (Router.depth > 0 ? Router.back() : Router.go("home")),
  tab: (d) => { S.tabs[d.k] = d.v; refresh(); },
  sort: (d) => { S.sort = d.v; refresh(); },
  view: (d) => { S.view.albums = d.v; refresh(); },
  density: (d) => { setPref("density", d.v); refresh(); },
  clearrecent: () => { S.recentSearches = []; refresh(); },
  toast: (d) => { closeLayer(); toast(d.msg); },
  peek: (d, el) => { const i = el.parentElement.querySelector("input"); i.type = i.type === "password" ? "text" : "password"; },
  keys: () => { S.keys = !S.keys; refresh(); },
  setnav: (d) => { S.tabs.setsec = d.sec; pending = d.sec; if (Router.current().path === d.page) { refresh(); document.getElementById(d.sec)?.scrollIntoView({ behavior: "smooth", block: "start" }); pending = null; } else Router.go(d.page); },
  retry: (d, el) => { el.innerHTML = `${icon("refresh")} Retrying`; el.disabled = true; setTimeout(() => { $("#err").innerHTML = `<div class="sec-h"><h2>Error, recovered</h2></div>${grid(MOCK.albums.slice(0, 4).map(A))}`; toast("Loaded"); }, 900); },
  "pref-mode": (d) => setPref("mode", d.v), "pref-accent": (d) => setPref("accent", d.v), "pref-radius": (d) => setPref("radius", +d.v),
  "pref-font": (d) => setPref("font", d.v), "pref-head": (d) => setPref("head", d.v), "pref-size": (d) => setPref("size", +d.v),
  "pref-density": (d) => setPref("density", d.v), "pref-glass": (d) => { delete S.prefs.lg; setPref("glass", d.v); },
  "pref-ambient": () => setPref("ambient", !S.prefs.ambient), "pref-motion": () => setPref("motion", !S.prefs.motion),
  "pref-reset": () => { S.prefs = { ...DEF }; applyPrefs(); refresh(); toast("Appearance reset"); },
};
// Registered before Router.start so actions can stop the router's data-go handler.
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]");
  if (a && !a.disabled) {
    e.preventDefault(); e.stopImmediatePropagation();
    ACT[a.dataset.act]?.({ ...a.dataset }, a, e);
    return;
  }
  const go = e.target.closest("[data-go]");
  if (go) { closeLayer(true); closeNP(); return; }
  const tr = e.target.closest(".tr[data-id]");
  if (tr && !e.target.closest("a,button")) ACT.playrow({}, tr.querySelector(".n") || tr);
});
document.addEventListener("input", (e) => {
  const k = e.target.dataset.input;
  if (!k) return;
  const v = e.target.value;
  if (k === "vol") { S.vol = +v; S.muted = !+v; $$('[data-input="vol"]').forEach((x) => x !== e.target && (x.value = v)); }
  else if (k === "accent") setPref("accent", v);
  else if (k === "radius") { S.prefs.radius = +v; applyPrefs(); e.target.nextElementSibling.textContent = v + "px"; $$('[data-act="pref-radius"]').forEach((b) => b.classList.toggle("on", +b.dataset.v === +v)); }
  else if (k === "pal") palResults(v);
  else S[k] = v;
});
// Scrubbing: tracks the pointer 1:1 for the whole drag.
document.addEventListener("pointerdown", (e) => {
  const t = e.target.closest("[data-scrub]");
  if (!t) return;
  e.stopPropagation();
  t.setPointerCapture(e.pointerId); t.classList.add("drag");
  const seek = (ev) => { const r = t.getBoundingClientRect(); S.pos = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * secs(S.now.d); progress(); };
  seek(e);
  const up = () => { t.classList.remove("drag"); t.removeEventListener("pointermove", seek); };
  t.addEventListener("pointermove", seek);
  t.addEventListener("pointerup", up, { once: true });
}, true);
// Focusable roots: anchors get a real href (Router still handles the click), clickable non-controls get
// tabindex and a role, and Enter (links) or Enter/Space (buttons) activates them.
function focusRoots() {
  $$("a[data-go]:not([href])").forEach((a) => (a.href = "#/" + a.dataset.go));
  $$("[data-go]:not(a,button,[tabindex]), .tr[data-id]:not([tabindex]), .qrow[data-act]:not([data-act='']):not([tabindex]), .pl-now:not([tabindex])").forEach((el) => {
    el.tabIndex = 0;
    if (!el.hasAttribute("role")) el.setAttribute("role", el.dataset.go ? "link" : "button");
  });
}
let focusRaf = 0;
new MutationObserver(() => { if (!focusRaf) focusRaf = requestAnimationFrame(() => { focusRaf = 0; focusRoots(); }); }).observe(document.body, { childList: true, subtree: true });
document.addEventListener("keydown", (e) => {
  const el = e.target;
  if (el.matches?.("[data-scrub]") && ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
    e.preventDefault(); e.stopImmediatePropagation();
    const max = secs(S.now.d);
    S.pos = e.key === "Home" ? 0 : e.key === "End" ? max - 1 : Math.max(0, Math.min(max - 1, S.pos + (e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : -5)));
    progress();
    return;
  }
  if (el.tabIndex === 0 && !/^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && (e.key === "Enter" || (e.key === " " && el.getAttribute("role") === "button"))) {
    e.preventDefault(); e.stopImmediatePropagation(); el.click();
  }
}, true);
document.addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(); return; }
  if (e.key === "Escape") { if (layer.innerHTML) closeLayer(); else closeNP(); return; }
  if ($(".palette") && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
    const rows = $$(".palette .prow"), i = rows.findIndex((r) => r.classList.contains("sel"));
    if (e.key === "Enter") { e.preventDefault(); const q = $(".palette input").value.trim(); if (i >= 0) rows[i].click(); else if (q) ACT.go({ to: "search/" + encodeURIComponent(q), q }); return; }
    e.preventDefault(); rows[i]?.classList.remove("sel");
    const n = rows[(i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length];
    n?.classList.add("sel"); n?.scrollIntoView({ block: "nearest" });
    return;
  }
  if (typing || !S.keys || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === "/") { e.preventDefault(); palette(); }
  else if (k === " ") { e.preventDefault(); toggle(); }
  else if (k === "n" || (e.shiftKey && k === "ArrowRight")) next();
  else if (k === "p" || (e.shiftKey && k === "ArrowLeft")) prev();
  else if (k === "l") ACT.like({ id: S.now.id });
  else if (k === "s") ACT.shuffle();
  else if (e.shiftKey && (k === "ArrowUp" || k === "ArrowDown")) { S.vol = Math.max(0, Math.min(1, S.vol + (k === "ArrowUp" ? 0.1 : -0.1))); renderPlayer(); toast(`Volume ${Math.round(S.vol * 100)}%`, "vol"); }
});

applyPrefs();
document.documentElement.classList.toggle("q-open", S.qOpen);
renderPlayer(); renderQueue();
Router.start(render);
focusRoots();
