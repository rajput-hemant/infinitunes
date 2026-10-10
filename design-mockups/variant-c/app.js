"use strict";
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  browse: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  settings: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  fwd: '<path d="m9 18 6-6-6-6"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  prev: '<polygon points="19 20 9 12 19 4 19 20"/><path d="M5 19V5"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4"/><path d="M19 5v14"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  queue: '<path d="M3 6h13"/><path d="M3 12h13"/><path d="M3 18h9"/><circle cx="19" cy="17" r="2"/><path d="M21 17V8"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  list: '<path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4"/><path d="M6.6 6.6C3.6 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m16 7 3 3"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
};
const FILLED = ["play", "pause", "prev", "next"];
const icon = (n, s = 16) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${FILLED.includes(n) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const ALB = MOCK.albums[0];
const albumRows = () => MOCK.albumTracks.map(([t, a, d]) => ({ t, a, d, i: ALB.img, al: ALB.title }));
const relRows = () => MOCK.newReleases.map((x) => ({ t: x.title, a: x.subtitle, d: x.duration, i: x.img, al: "Single", go: "song/" + x.id }));
const artRows = () => MOCK.artistSongs.map(([t, a, d, i]) => ({ t, a, d, i, al: "Dhurandhar The Revenge" }));
const QUEUE = albumRows();
const secs = (d) => { const [m, s] = String(d || "03:30").split(":").map(Number); return m * 60 + s; };
const fmt = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");

const S = {
  view: "table", lang: "All", liked: new Set(["Billie Jean"]),
  now: { t: MOCK.song.title, a: MOCK.song.artist, i: MOCK.song.img, d: MOCK.song.duration },
  playing: false, prog: 30, vol: 70, queue: true, atab: "overview", stab: "all", sec: null,
  mode: "light", theme: "rose", radius: "0.5", langs: new Set(["Hindi", "English"]),
  stream: "160kbps", download: "320kbps", image: "high", keys: true, plName: "Road Trip", editPl: false,
};

const likeBtn = (k) => `<button class="ib${S.liked.has(k) ? " on" : ""}" data-act="like" data-k="${esc(k)}" aria-label="Like">${icon("heart")}</button>`;
const thumb = (i, round) => i ? `<img class="${round ? "rd" : ""}" src="${MOCK.img(i, 150)}" alt="" loading="lazy">` : `<span class="ph ${round ? "rd" : ""}">${icon("radio")}</span>`;
const attrs = (o) => `data-t="${esc(o.t)}" data-a="${esc(o.a)}" data-i="${o.i || ALB.img}" data-d="${o.d || "03:30"}"${o.go ? ` data-go="${o.go}"` : ""}`;

const row = (o, n) => `<div class="tr${S.now.t === o.t ? " cur" : ""}" ${attrs(o)}><span class="n"><em>${n + 1}</em><button class="pb" aria-label="Play">${icon("play")}</button></span><span class="ti">${thumb(o.i, o.round)}<span class="tt"><b>${esc(o.t)}</b><small>${esc(o.a)}</small></span></span><span class="ar">${esc(o.a)}</span><span class="al">${esc(o.al || "")}</span><span class="du">${o.d || ""}</span><span class="ac">${likeBtn(o.t)}<button class="ib mo" data-act="more" aria-label="More">${icon("more")}</button></span></div>`;
const th = (l) => `<div class="th"><span>${l[0]}</span><span>${l[1]}</span><span>${l[2]}</span><span class="al">${l[3]}</span><span style="text-align:right">${l[4]}</span><span></span></div>`;
const tracks = (list, alb = true) => `<div class="tbl${alb ? "" : " noalb"}">${th(["#", "Title", "Artist", "Album", "Time"])}${list.map(row).join("")}</div>`;

const head = (title, meta, actions = "") => `<div class="phd"><h1>${title}</h1>${meta ? `<span class="muted">${meta}</span>` : ""}<span class="sp"></span>${actions}</div>`;
const vtoggle = () => `<div class="seg">${["table", "grid"].map((v) => `<button class="ib${S.view === v ? " on" : ""}" data-act="view" data-v="${v}" aria-label="${v} view">${icon(v === "grid" ? "browse" : "list")}</button>`).join("")}</div>`;
const sec = (t, go, body) => `<section class="sec"><div class="sh"><h2>${t}</h2>${go ? `<a data-go="${go}">See all</a>` : ""}</div>${body}</section>`;
const card = (img, t, s, go, round, extra = "") => `<a class="card${round ? " rdc" : ""}" ${go ? `data-go="${go}"` : extra}>${img ? `<img class="${round ? "rd" : ""}" src="${MOCK.img(img, 150)}" alt="" loading="lazy">` : `<span class="ph">${icon("radio", 24)}</span>`}<b>${esc(t)}</b><small>${esc(s)}</small></a>`;
const chips = (list, cur, act, all) => `<div class="chips">${(all ? ["All", ...list] : list).map((c) => `<button class="chip${c === cur ? " on" : ""}" data-act="${act}" data-v="${esc(c)}">${c}</button>`).join("")}</div>`;
const tabs = (list, cur, mk) => `<div class="tabs">${list.map(([id, l]) => mk(id, l, id === cur)).join("")}</div>`;

const albumItems = () => MOCK.albums.map((x) => ({ t: x.title, a: x.subtitle, c: x.year, i: x.img, go: "album/" + x.id }));
const playlistItems = () => MOCK.playlists.map((x) => ({ t: x.title, a: x.subtitle, c: "Playlist", i: x.img, go: "playlist/" + x.id }));
const chartItems = () => MOCK.charts.map((x) => ({ t: x.title, a: x.subtitle, c: "Chart", i: x.img, go: "playlist/" + x.id }));
const artistItems = () => MOCK.artists.map((x) => ({ t: x.name, a: x.listeners + " listeners", c: "Artist", i: x.img, go: "artist/" + x.id, round: true }));
const radioItems = () => MOCK.radio.map((x) => ({ t: x, a: "Live station", c: "Radio", i: "" }));
const showItems = () => MOCK.shows.map((x) => ({ t: x.title, a: x.subtitle, c: "Podcast", i: x.img, go: "show/" + x.id }));

function catalog(title, items, labels, top = "") {
  const body = S.view === "grid"
    ? `<div class="grid">${items.map((x) => card(x.i, x.t, x.a, x.go, x.round, attrs(x))).join("")}</div>`
    : `<div class="tbl">${th(["#", "Title", labels[0], labels[1], ""])}${items.map((x, n) => row({ ...x, al: x.c }, n)).join("")}</div>`;
  return head(title, items.length + " items", vtoggle()) + top + (items.length ? body : '<p class="muted">Nothing matches this filter.</p>');
}

function detail(o) {
  const f = o.first;
  return `<div class="band"><img class="hero${o.round ? " rd" : ""}" src="${MOCK.img(o.img, 500)}" alt=""><div class="bi"><small class="kind">${o.kind}</small><h1>${esc(o.title)}</h1><p class="muted">${o.meta}</p><div class="acts"><button class="btn pri" ${attrs({ ...f, go: "" })}>${icon("play")} Play</button>${o.follow ? `<button class="btn" data-act="follow">Follow</button>` : ""}${likeBtn(o.title)}<button class="ib" data-act="more" aria-label="More">${icon("more")}</button></div></div></div>`;
}

function home() {
  const mix = MOCK.playlists.slice(0, 5).flatMap((p, n) => [p, MOCK.albums[n]]);
  const jump = [...MOCK.albums.slice(0, 4).map((x) => [x.title, x.img, "album/" + x.id]), ...MOCK.playlists.slice(0, 4).map((x) => [x.title, x.img, "playlist/" + x.id])];
  return head("Home", "Good evening, " + MOCK.user.name)
    + sec("Jump back in", "", `<div class="tiles">${jump.map(([t, i, g]) => `<a class="tile" data-go="${g}"><img src="${MOCK.img(i, 150)}" alt=""><b>${esc(t)}</b></a>`).join("")}</div>`)
    + sec("Trending", "playlists", `<div class="shelf">${mix.map((x) => card(x.img, x.title, x.subtitle, (x.year ? "album/" : "playlist/") + x.id)).join("")}</div>`)
    + sec("New Releases", "browse", `<div class="tbl noalb">${th(["#", "Title", "Artist", "", "Time"])}${relRows().slice(0, 6).map(row).join("")}</div>`)
    + sec("Top Charts", "chart", `<div class="shelf">${MOCK.charts.map((x) => card(x.img, x.title, x.subtitle, "playlist/" + x.id)).join("")}</div>`)
    + sec("Top Artists", "artists", `<div class="shelf">${MOCK.artists.map((x) => card(x.img, x.name, x.listeners + " listeners", "artist/" + x.id, true)).join("")}</div>`)
    + sec("Top Playlists", "playlists", `<div class="shelf">${MOCK.playlists.map((x) => card(x.img, x.title, x.subtitle, "playlist/" + x.id)).join("")}</div>`)
    + sec("Languages", "browse", chips(MOCK.languages, "", "lang"));
}

function browse() {
  const hub = [["Albums", "albums", "music"], ["Playlists", "playlists", "list"], ["Artists", "artists", "user"], ["Radio", "radio", "radio"], ["Podcasts", "shows", "mic"], ["Charts", "chart", "chart"]];
  return head("Browse") + `<div class="tiles">${hub.map(([t, g, ic]) => `<a class="tile" data-go="${g}"><span class="ph" style="width:44px;height:44px;flex:none">${icon(ic)}</span><b>${t}</b></a>`).join("")}</div>`
    + sec("Languages", "", chips(MOCK.languages, "", "lang"));
}

function albums() {
  const l = S.lang;
  const items = albumItems().filter((x) => l === "All" || x.i.includes(l));
  return catalog("Albums", items, ["Artist", "Year"], chips(MOCK.languages, l, "lang", true));
}

function album(id) {
  const a = MOCK.albums.find((x) => x.id === id) || ALB;
  const rows = albumRows();
  return detail({ img: a.img, kind: "Album", title: a.title, meta: `${a.subtitle} · ${a.year} · 13 songs · 57:30`, first: rows[0] }) + tracks(rows, false);
}

function playlist(id) {
  const p = MOCK.playlists.find((x) => x.id === id) || MOCK.charts.find((x) => x.id === id) || MOCK.playlists[0];
  const rows = [...relRows(), ...albumRows().slice(0, 4)].map((x) => ({ ...x, go: "" }));
  return detail({ img: p.img, kind: "Playlist", title: p.title, meta: `${p.subtitle} · ${rows.length} songs`, first: rows[0] }) + tracks(rows);
}

function song(id) {
  const s = MOCK.song;
  const rel = MOCK.newReleases.find((x) => x.id === id);
  const t = rel ? { ...s, title: rel.title, artist: rel.subtitle, duration: rel.duration, img: rel.img, album: "Single" } : s;
  const first = { t: t.title, a: t.artist, d: t.duration, i: t.img };
  return detail({ img: t.img, kind: "Song", title: t.title, meta: `${esc(t.artist)} · ${t.year}`, first })
    + `<div class="kv"><span>Album</span><a data-go="album/${t.albumId || "michael"}">${esc(t.album)}</a><span>Artist</span><span>${esc(t.artist)}</span><span>Year</span><span>${t.year}</span><span>Language</span><span>${t.language}</span><span>Duration</span><span>${t.duration}</span><span>Plays</span><span>${t.plays}</span></div>`
    + `<div class="box">Lyrics are not available in this mockup. Lines would scroll here in sync with playback.</div>`
    + sec("More from Michael: Songs From The Motion Picture", "album/michael", tracks(albumRows().slice(0, 5), false));
}

function show(id) {
  const s = MOCK.shows.find((x) => x.id === id) || MOCK.shows[0];
  const rows = MOCK.episodes.map(([t, a, d], n) => ({ t, a, d, i: s.img, al: "Episode " + (n + 1), go: "episode/" + (n + 1) }));
  return detail({ img: s.img, kind: "Podcast", title: s.title, meta: `${s.subtitle} · ${rows.length} episodes`, first: rows[0], follow: true })
    + `<div class="tbl noalb">${th(["#", "Episode", "Season", "", "Time"])}${rows.map(row).join("")}</div>`;
}

function episode(id) {
  const s = MOCK.shows[0], n = Math.max(1, Math.min(5, +id || 1));
  const [t, a, d] = MOCK.episodes[n - 1];
  const more = MOCK.episodes.map(([t2, a2, d2], k) => ({ t: t2, a: a2, d: d2, i: s.img, go: "episode/" + (k + 1) })).filter((_, k) => k !== n - 1);
  return detail({ img: s.img, kind: "Episode", title: t, meta: `${s.title} · ${a} · ${d}`, first: { t, a: s.title, d, i: s.img } })
    + `<p style="max-width:560px;margin-bottom:16px">A reading and reflection from the series, recorded in studio. Listen to the full episode and follow the show for new parts every week.</p>`
    + sec("More episodes", "show/" + s.id, `<div class="tbl noalb">${th(["#", "Episode", "Season", "", "Time"])}${more.map(row).join("")}</div>`);
}

function artist(id) {
  const a = MOCK.artists.find((x) => x.id === id) || MOCK.artists[0];
  const rows = artRows();
  const tabsH = tabs([["overview", "Overview"], ["songs", "Songs"], ["albums", "Albums"], ["bio", "Biography"]], S.atab, (i, l, on) => `<button class="${on ? "on" : ""}" data-act="atab" data-v="${i}">${l}</button>`);
  const body = {
    overview: sec("Top songs", "", tracks(rows.slice(0, 5), false)) + sec("Albums", "", `<div class="shelf">${MOCK.albums.slice(0, 6).map((x) => card(x.img, x.title, x.year, "album/" + x.id)).join("")}</div>`),
    songs: tracks(rows, false),
    albums: `<div class="grid">${MOCK.albums.slice(0, 8).map((x) => card(x.img, x.title, x.year, "album/" + x.id)).join("")}</div>`,
    bio: `<p style="max-width:620px">${esc(a.name)} is one of the most listened to artists on the platform, with ${a.listeners} monthly listeners. Known for cinematic arrangements and chart-topping soundtracks, the catalog spans film scores, singles and live sessions.</p>`,
  }[S.atab];
  return detail({ img: a.img, kind: "Artist", title: a.name, meta: a.listeners + " monthly listeners", first: rows[0], follow: true, round: true }) + tabsH + body;
}

function searchPage(q) {
  const input = `<div class="sb sbp"><input data-search value="${esc(q)}" placeholder="Search" aria-label="Search"></div>`;
  if (!q) {
    return head("Search") + input
      + sec("Recent searches", "", `<div class="list">${MOCK.recentSearches.map((r) => `<a class="row" data-go="search/${encodeURIComponent(r)}">${icon("search")}<span>${esc(r)}</span></a>`).join("")}</div>`)
      + sec("Browse categories", "", `<div class="tiles">${["Pop", "Hip-hop", "Romantic", "Devotional", "Party", "Workout", "Chill", "Retro"].map((c) => `<a class="tile" data-go="search/${c}"><span class="ph" style="width:44px;height:44px;flex:none">${icon("music")}</span><b>${c}</b></a>`).join("")}</div>`);
  }
  const ql = q.toLowerCase();
  const pick = (list, f, n) => { const m = list.filter((x) => f(x).toLowerCase().includes(ql)); return m.length ? m.slice(0, n) : list.slice(0, Math.min(n, 3)); };
  const songs = pick([...relRows(), ...albumRows(), ...artRows()].map((x) => ({ ...x, go: x.go })), (x) => x.t + x.a, 6);
  const albs = pick(MOCK.albums, (x) => x.title + x.subtitle, 6);
  const arts = pick(MOCK.artists, (x) => x.name, 6);
  const pls = pick(MOCK.playlists, (x) => x.title, 6);
  const top = arts.find((x) => x.name.toLowerCase().includes(ql)) || arts[0];
  const st = S.stab, show = (k) => st === "all" || st === k;
  const tb = tabs([["all", "All"], ["songs", "Songs"], ["albums", "Albums"], ["artists", "Artists"], ["playlists", "Playlists"]], st, (i, l, on) => `<button class="${on ? "on" : ""}" data-act="stab" data-v="${i}">${l}</button>`);
  return head("Results for \"" + esc(q) + "\"") + input + tb
    + (st === "all" ? sec("Top result", "", `<a class="top" data-go="artist/${top.id}"><img src="${MOCK.img(top.img, 150)}" alt=""><div><b style="font-size:15px">${esc(top.name)}</b><div class="muted">Artist · ${top.listeners} listeners</div></div></a>`) : "")
    + (show("songs") ? sec("Songs", "", tracks(songs, false)) : "")
    + (show("albums") ? sec("Albums", "", `<div class="shelf">${albs.map((x) => card(x.img, x.title, x.subtitle, "album/" + x.id)).join("")}</div>`) : "")
    + (show("artists") ? sec("Artists", "", `<div class="shelf">${arts.map((x) => card(x.img, x.name, x.listeners, "artist/" + x.id, true)).join("")}</div>`) : "")
    + (show("playlists") ? sec("Playlists", "", `<div class="shelf">${pls.map((x) => card(x.img, x.title, x.subtitle, "playlist/" + x.id)).join("")}</div>`) : "");
}

const MET = [["playlists", "My Playlists"], ["recent", "Recently Played"], ["songs", "Liked Songs"], ["albums", "Liked Albums"], ["lplaylists", "Liked Playlists"], ["artists", "Liked Artists"], ["podcasts", "Liked Podcasts"]];
function me(tab = "playlists") {
  const prof = `<div class="prof"><div class="sbig">H</div><div><h1>${MOCK.user.name}</h1><p class="muted">${MOCK.user.email}</p></div><span class="sp"></span><button class="btn" data-go="settings">${icon("edit")} Edit</button><button class="btn" data-go="login">${icon("logout")} Logout</button></div>`;
  const tb = tabs(MET, tab, (i, l, on) => `<a class="${on ? "on" : ""}" data-go="me/${i}">${l}</a>`);
  const grid = (items) => `<div class="grid">${items.join("")}</div>`;
  const body = {
    playlists: `<div class="grid"><a class="card" data-go="me/playlist/road-trip"><span class="ph">${icon("music", 24)}</span><b>${esc(S.plName)}</b><small>5 songs</small></a><a class="card" data-act="more"><span class="ph">${icon("plus", 24)}</span><b>New playlist</b><small>Create</small></a></div>`,
    recent: tracks(relRows().slice(0, 6).map((x) => ({ ...x, go: "" }))),
    songs: tracks(albumRows().slice(5, 11), false),
    albums: grid(MOCK.albums.slice(0, 5).map((x) => card(x.img, x.title, x.subtitle, "album/" + x.id))),
    lplaylists: grid(MOCK.playlists.slice(0, 4).map((x) => card(x.img, x.title, x.subtitle, "playlist/" + x.id))),
    artists: grid(MOCK.artists.slice(0, 5).map((x) => card(x.img, x.name, x.listeners, "artist/" + x.id, true))),
    podcasts: grid(MOCK.shows.map((x) => card(x.img, x.title, x.subtitle, "show/" + x.id))),
  }[tab] || "";
  return prof + tb + body;
}

function userPlaylist() {
  const rows = albumRows().slice(5, 10);
  const name = S.editPl
    ? `<input class="inp" id="plname" value="${esc(S.plName)}" style="width:220px"><button class="btn pri" data-act="plsave">Save</button>`
    : `<h1>${esc(S.plName)}</h1>`;
  return `<div class="phd">${name}<span class="muted">${rows.length} songs</span><span class="sp"></span><button class="btn pri" ${attrs(rows[0])}>${icon("play")} Play</button><button class="btn" data-act="pledit">${icon("edit")} Rename</button><button class="btn bad" data-act="pldel">${icon("trash")} Delete</button></div>` + tracks(rows, false);
}

const field = (l, type, val, help, id = "") => `<div class="fld"><label>${l}</label><input class="inp" type="${type}" value="${esc(val)}" ${id ? `id="${id}"` : ""}>${help ? `<div class="help">${help}</div>` : ""}</div>`;
const sbtn = (act, v, label, on, pre = "") => `<button class="sbtn${on ? " on" : ""}" data-act="${act}" data-v="${v}">${pre}${label}</button>`;
const sel = (k, opts) => `<select class="sel" data-q="${k}">${opts.map((o) => `<option${S[k] === o ? " selected" : ""}>${o}</option>`).join("")}</select>`;
const SNAV = [["Account", [["Edit Profile", "settings", "profile"], ["Change Password", "settings", "password"], ["Delete Account", "settings", "delete"]]], ["Appearance", [["Mode", "settings/appearance", "mode"], ["Themes", "settings/appearance", "themes"], ["Radius", "settings/appearance", "radius"]]], ["Preferences", [["Language", "settings/preferences", "lang"], ["Stream Quality", "settings/preferences", "quality"], ["Download Quality", "settings/preferences", "quality"], ["Image Quality", "settings/preferences", "quality"]]]];

function settings(page) {
  const cur = page ? "settings/" + page : "settings";
  const nav = `<nav class="snav">${SNAV.map(([g, items]) => `<div><h4>${g}</h4>${items.map(([l, go, s]) => `<a data-go="${go}" data-sec="${s}" class="${go === cur ? "on" : ""}">${l}</a>`).join("")}</div>`).join("")}</nav>`
    + `<div class="stabs">${[["Account", "settings"], ["Appearance", "settings/appearance"], ["Preferences", "settings/preferences"]].map(([l, g]) => `<a class="chip${g === cur ? " on" : ""}" data-go="${g}">${l}</a>`).join("")}</div>`;
  let body;
  if (page === "appearance") {
    body = `<div class="ss" id="s-mode" style="border:0;padding-top:0"><h3>Theme Mode</h3><p class="muted">Select light, dark, or follow your system.</p><div class="wrap">${[["light", "Light", "sun"], ["dark", "Dark", "moon"], ["system", "System", "monitor"]].map(([v, l, ic]) => sbtn("mode", v, l, S.mode === v, icon(ic))).join("")}</div></div>`
      + `<div class="ss" id="s-themes"><h3>Themes</h3><p class="muted">Pick the accent color used across the app.</p><div class="wrap">${MOCK.themes.map(([n, c]) => sbtn("theme", n, n, S.theme === n, `<span class="dot" style="background:${c}"></span>`)).join("")}</div></div>`
      + `<div class="ss" id="s-radius"><h3>Radius</h3><p class="muted">Corner roundness of buttons and inputs.</p><div class="wrap">${MOCK.radii.map((r) => sbtn("radius", r, r, S.radius === r)).join("")}</div></div>`;
  } else if (page === "preferences") {
    body = `<div class="ss" id="s-lang" style="border:0;padding-top:0"><h3>Languages</h3><p class="muted">Choose the languages you listen to.</p><div class="wrap" style="margin-bottom:12px">${MOCK.languages.map((l) => `<button class="chip${S.langs.has(l) ? " on" : ""}" data-act="langt" data-v="${l}">${l}</button>`).join("")}</div><button class="btn pri" data-act="saved">Save Preferences</button></div>`
      + `<div class="ss" id="s-quality"><h3>Quality Settings</h3><p class="muted" style="margin-bottom:4px">Tune streaming, downloads and artwork.</p><div class="qr"><span class="muted">Stream Quality</span>${sel("stream", MOCK.qualities.stream)}</div><div class="qr"><span class="muted">Download Quality</span>${sel("download", MOCK.qualities.stream)}</div><div class="qr"><span class="muted">Image Quality</span>${sel("image", MOCK.qualities.image)}</div></div>`
      + `<div class="ss"><h3>Keyboard</h3><div class="qr" style="height:36px;border:0"><span>Keyboard shortcuts</span><button class="sw${S.keys ? " on" : ""}" data-act="keys" aria-label="Keyboard shortcuts"></button></div><p class="muted">Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume.</p></div>`;
  } else {
    body = `<div class="sgrid" id="s-profile"><div><h3>Account Settings</h3><p class="muted" style="margin-bottom:12px">This is how others will see you on the site.</p><form class="fm" data-form="save">${field("Name", "text", MOCK.user.name, "This is your public display name.")}${field("Email", "email", MOCK.user.email, "Used to sign in and for account notices.")}<div id="s-password" class="fm">${field("Current Password", "password", "", "Required only when changing your password.")}<div class="fld"><label>New Password</label><div class="pw"><input class="inp" type="password" id="np"><button type="button" class="ib" data-act="showpw" aria-label="Show password">${icon("eye")}</button></div><div class="help">Use at least 8 characters.</div></div></div><div><button class="btn pri">Save Changes</button></div></form></div><aside><div class="sbig">H</div><button class="btn" data-act="more">Change avatar</button></aside></div>`
      + `<div class="ss"><h3>Passkeys</h3><p class="muted">Sign in with your fingerprint, face or device PIN.</p><button class="btn" data-act="more">${icon("key")} Add passkey</button></div>`
      + `<div class="dz" id="s-delete"><h3>Delete Account</h3><p class="muted" style="margin:2px 0 10px">Permanently remove your account and all data. This cannot be undone.</p><button class="btn bad" data-act="more">${icon("trash")} Delete Account</button></div>`;
  }
  return `<div class="phd" style="display:block"><h1>Settings</h1><p class="muted">Manage your account, appearance, and preference settings.</p></div><div class="sl" style="margin-top:12px">${nav.split('<div class="stabs">')[0]}<div>${'<div class="stabs">' + nav.split('<div class="stabs">')[1]}${body}</div></div>`;
}

function auth(kind) {
  const su = kind === "signup";
  return `<a class="abk" data-back>${icon("back")} Back</a><div class="acard"><div class="logo">infinitunes</div><div><h3>${su ? "Create an account" : "Welcome back"}</h3><p class="muted">${su ? "Enter your details to get started" : "Sign in to your account"}</p></div>
<form class="fm" style="max-width:none" data-form="auth">${field("Email", "email", "", "")}${field("Password", "password", "", "")}${su ? field("Confirm password", "password", "", "") : ""}<button class="btn pri wide">${su ? "Sign Up" : "Login with Email"}</button></form>
${su ? "" : `<button class="btn wide" data-go="home">${icon("key")} Sign in with passkey</button>`}<div class="or">or continue with</div><div class="two"><button class="btn" data-go="home">Google</button><button class="btn" data-go="home">GitHub</button></div>
<p class="foot">${su ? `Have an account? <a data-go="login">Login</a>` : `No account? <a data-go="signup">Sign up</a> · <a data-act="more">Forgot password?</a>`}</p></div>`;
}

const RAIL = [["home", "home", "Home"], ["search", "search", "Search"], ["browse", "browse", "Browse"], ["chart", "chart", "Charts"], ["shows", "mic", "Podcasts"], ["radio", "radio", "Radio"], ["me", "library", "Library"], ["settings", "settings", "Settings"]];
const SECTION = { home: "home", search: "search", browse: "browse", albums: "browse", playlists: "browse", artists: "browse", album: "browse", playlist: "browse", artist: "browse", song: "browse", chart: "chart", shows: "shows", show: "shows", episode: "shows", radio: "radio", me: "me", settings: "settings" };
const PARENT = { album: ["Albums", "albums"], playlist: ["Playlists", "playlists"], artist: ["Artists", "artists"], song: ["Browse", "browse"], show: ["Podcasts", "shows"], episode: ["Podcasts", "shows"], albums: ["Browse", "browse"], playlists: ["Browse", "browse"], artists: ["Browse", "browse"], radio: ["Browse", "browse"], shows: ["Browse", "browse"], chart: ["Browse", "browse"], search: ["Home", "home"], browse: ["Home", "home"], me: ["Library", "me"], settings: ["Home", "home"] };
const MTABS = [["home", "Home"], ["browse", "Browse"], ["chart", "Charts"], ["shows", "Podcasts"], ["me", "Library"], ["settings", "Settings"]];

function view(r) {
  const [a, b] = r.params;
  switch (r.name) {
    case "home": return ["Home", home()];
    case "browse": return ["Browse", browse()];
    case "albums": return ["Albums", albums()];
    case "playlists": return ["Playlists", catalog("Playlists", playlistItems(), ["Followers", "Type"])];
    case "artists": return ["Artists", catalog("Artists", artistItems(), ["Listeners", "Type"])];
    case "radio": return ["Radio", catalog("Radio", radioItems(), ["Status", "Type"])];
    case "shows": return ["Podcasts", catalog("Podcasts", showItems(), ["Genre", "Type"])];
    case "chart": return ["Charts", catalog("Charts", chartItems(), ["Update", "Type"])];
    case "album": return [(MOCK.albums.find((x) => x.id === a) || ALB).title, album(a)];
    case "playlist": return [(MOCK.playlists.find((x) => x.id === a) || MOCK.charts.find((x) => x.id === a) || MOCK.playlists[0]).title, playlist(a)];
    case "song": return [(MOCK.newReleases.find((x) => x.id === a) || { title: MOCK.song.title }).title, song(a)];
    case "show": return [MOCK.shows[0].title, show(a)];
    case "episode": return ["Episode " + (a || 1), episode(a)];
    case "artist": return [(MOCK.artists.find((x) => x.id === a) || MOCK.artists[0]).name, artist(a)];
    case "search": return [a ? "Results" : "Search", searchPage(a || "")];
    case "me": return a === "playlist" ? [S.plName, userPlaylist()] : [(MET.find((m) => m[0] === (a || "playlists")) || MET[0])[1], me(a)];
    case "settings": return [{ appearance: "Appearance", preferences: "Preferences" }[a] || "Account", settings(a)];
    case "login": return ["Login", auth("login")];
    case "signup": return ["Sign up", auth("signup")];
    default: return ["Home", home()];
  }
}

function render(r) {
  const isAuth = r.name === "login" || r.name === "signup";
  document.body.classList.toggle("auth", isAuth);
  document.body.classList.toggle("home", r.name === "home");
  document.body.classList.remove("npopen");
  const [title, html] = view(r);
  document.title = title + " - infinitunes";
  if (isAuth) { $("#auth").innerHTML = html; return; }
  const par = PARENT[r.name];
  $("#crumb").innerHTML = (par && !(r.name === "me" && !r.params.length) ? `<a data-go="${par[1]}">${par[0]}</a><i>/</i>` : "") + `<b>${esc(title)}</b>`;
  $("#bk").disabled = r.name === "home";
  $("#page").innerHTML = html;
  const pg = $("#page");
  pg.scrollTop = 0;
  if (S.sec) { const el = $("#s-" + S.sec); if (el) el.scrollIntoView(); S.sec = null; }
  const cur = SECTION[r.name];
  $("#rail").innerHTML = `<div class="logo-i">${icon("music")}</div>` + RAIL.map(([g, ic, l]) => `<a class="rb${cur === g ? " on" : ""}" data-go="${g}" data-tip="${l}" aria-label="${l}">${icon(ic)}</a>`).join("") + `<span class="sp"></span><button class="av" data-act="menu" aria-label="Account">H</button>`;
  $("#mtabs").innerHTML = MTABS.map(([g, l]) => `<a class="${cur === g ? "on" : ""}" data-go="${g}">${l}</a>`).join("");
  const on = $("#mtabs .on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
  $("#sq").value = r.name === "search" && r.params[0] ? r.params[0] : "";
}

const rerender = () => { const p = $("#page"), y = p.scrollTop; render(Router.current()); p.scrollTop = y; };

const npHtml = () => {
  const n = S.now;
  return `<div class="np"><img class="npart" src="${MOCK.img(n.i, 500)}" alt=""><div class="npm"><div class="tt"><b>${esc(n.t)}</b><small>${esc(n.a)}</small></div>${likeBtn(n.t)}</div>
<div class="np-ctl"><div class="bar"><i class="seekfill" style="width:${S.prog}%"></i></div><div class="times"><span class="tcur"></span><span>${n.d}</span></div><div class="cc"><button class="ib" data-act="prev" aria-label="Previous">${icon("prev", 20)}</button><button class="ib big" data-act="pp" aria-label="Play or pause" style="width:48px;height:48px">${icon(S.playing ? "pause" : "play", 22)}</button><button class="ib" data-act="next" aria-label="Next">${icon("next", 20)}</button></div></div>
<h4>Up next</h4>${QUEUE.map((q) => `<button class="qi${q.t === n.t ? " cur" : ""}" ${attrs(q)}><img src="${MOCK.img(q.i, 150)}" alt=""><span class="tt"><b>${esc(q.t)}</b><small>${esc(q.a)}</small></span><span class="muted">${q.d}</span></button>`).join("")}</div>`;
};

function draw() {
  const n = S.now;
  $("#player").innerHTML = `<div class="seek"><i class="seekfill" style="width:${S.prog}%"></i></div>
<div class="pl-info" data-act="npopen"><img src="${MOCK.img(n.i, 150)}" alt=""><span class="tt"><b>${esc(n.t)}</b><small>${esc(n.a)}</small></span>${likeBtn(n.t)}</div>
<div class="pl-mid"><button class="ib" data-act="prev" aria-label="Previous">${icon("prev")}</button><button class="ib big" data-act="pp" aria-label="Play or pause">${icon(S.playing ? "pause" : "play")}</button><button class="ib" data-act="next" aria-label="Next">${icon("next")}</button><span class="time"><span class="tcur"></span> / ${n.d}</span></div>
<div class="pl-r"><span class="muted">${icon("volume")}</span><input class="vol" type="range" min="0" max="100" value="${S.vol}" aria-label="Volume"><button class="ib${S.queue ? " on" : ""}" data-act="queue" aria-label="Queue">${icon("queue")}</button></div>`;
  $("#rp").innerHTML = `<div class="rph"><h2>Now Playing</h2><button class="ib" data-act="queue" aria-label="Close queue">${icon("x")}</button></div>` + npHtml();
  $("#npf").innerHTML = `<div class="rph"><h2>Now Playing</h2><button class="ib" data-act="npclose" aria-label="Close">${icon("x")}</button></div>` + npHtml();
  $("#app").classList.toggle("noq", !S.queue);
  tick(0);
}

function tick(dp) {
  S.prog = Math.min(100, S.prog + dp);
  document.querySelectorAll(".seekfill").forEach((e) => (e.style.width = S.prog + "%"));
  const t = fmt((S.prog / 100) * secs(S.now.d));
  document.querySelectorAll(".tcur").forEach((e) => (e.textContent = t));
}

function play(d) {
  S.now = { t: d.t, a: d.a, i: d.i || ALB.img, d: d.d || "03:30" };
  S.playing = true; S.prog = 0;
  draw();
  document.querySelectorAll(".tr").forEach((r) => r.classList.toggle("cur", r.dataset.t === d.t));
}

const step = (k) => {
  const qi = QUEUE.findIndex((q) => q.t === S.now.t);
  const q = QUEUE[(qi + k + QUEUE.length) % QUEUE.length];
  play(attrsOf(q));
};
const attrsOf = (o) => ({ t: o.t, a: o.a, i: o.i, d: o.d });
setInterval(() => {
  if (!S.playing) return;
  tick((0.25 / secs(S.now.d)) * 100);
  if (S.prog >= 100) step(1);
}, 250);

function toast(m) {
  const t = $("#toast"); t.textContent = m; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 1600);
}

function applyTheme() {
  const h = document.documentElement;
  const dark = S.mode === "dark" || (S.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  h.classList.toggle("dark", dark);
  const c = MOCK.themes.find((t) => t[0] === S.theme)[1];
  h.style.setProperty("--primary", c);
  h.style.setProperty("--pfg", S.theme === "yellow" ? "#18181b" : "#fff");
  h.style.setProperty("--radius", S.radius + "rem");
}

const go = (p) => Router.go(p);
const ACTS = {
  menu: () => $("#menu").classList.toggle("open"),
  fwd: () => history.forward(),
  like: (el) => { const k = el.dataset.k; S.liked.has(k) ? S.liked.delete(k) : S.liked.add(k); document.querySelectorAll(`[data-act=like]`).forEach((b) => b.dataset.k === k && b.classList.toggle("on", S.liked.has(k))); },
  more: () => toast("More actions are not part of this mockup"),
  follow: (el) => { el.textContent = el.textContent === "Follow" ? "Following" : "Follow"; },
  saved: () => toast("Saved"),
  view: (el) => { S.view = el.dataset.v; rerender(); },
  lang: (el) => { S.lang = el.dataset.v; if (Router.current().name === "albums") rerender(); else go("albums"); },
  atab: (el) => { S.atab = el.dataset.v; rerender(); },
  stab: (el) => { S.stab = el.dataset.v; rerender(); },
  mode: (el) => { S.mode = el.dataset.v; applyTheme(); rerender(); },
  theme: (el) => { S.theme = el.dataset.v; applyTheme(); rerender(); },
  radius: (el) => { S.radius = el.dataset.v; applyTheme(); rerender(); },
  langt: (el) => { const v = el.dataset.v; S.langs.has(v) ? S.langs.delete(v) : S.langs.add(v); rerender(); },
  keys: () => { S.keys = !S.keys; rerender(); },
  showpw: (el) => { const i = $("#np"), s = i.type === "password"; i.type = s ? "text" : "password"; el.innerHTML = icon(s ? "eyeoff" : "eye"); },
  queue: () => { S.queue = !S.queue; draw(); },
  npopen: () => { if (matchMedia("(max-width:767px)").matches) document.body.classList.add("npopen"); },
  npclose: () => document.body.classList.remove("npopen"),
  pp: () => { S.playing = !S.playing; draw(); },
  prev: () => step(-1),
  next: () => step(1),
  pledit: () => { S.editPl = true; rerender(); },
  plsave: () => { S.plName = $("#plname").value.trim() || S.plName; S.editPl = false; rerender(); },
  pldel: () => { S.editPl = false; go("me/playlists"); },
};

document.addEventListener("click", (e) => {
  const g = (s) => e.target.closest(s);
  if (!g("[data-act=menu]")) $("#menu").classList.remove("open");
  const sec = g("[data-sec]"); if (sec) S.sec = sec.dataset.sec;
  const stop = () => { e.stopImmediatePropagation(); e.preventDefault(); };
  let el;
  if ((el = g("[data-act]"))) { ACTS[el.dataset.act](el); return stop(); }
  if ((el = g(".pb"))) { play(el.closest(".tr").dataset); return stop(); }
  if ((el = g("[data-t]:not([data-go])"))) { play(el.dataset); return stop(); }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("[data-search]")) {
    const q = e.target.value.trim();
    if (q) go("search/" + encodeURIComponent(q));
  }
});
document.addEventListener("change", (e) => { if (e.target.dataset.q) S[e.target.dataset.q] = e.target.value; });
document.addEventListener("input", (e) => { if (e.target.classList.contains("vol")) S.vol = +e.target.value; });
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.dataset.form === "auth") go("home"); else toast("Changes saved");
});

$("#bk").innerHTML = icon("back");
$("#sbi").innerHTML = icon("search");
$("#msi").innerHTML = icon("search");
document.querySelector(".fw").innerHTML = icon("fwd");
$("#menu").innerHTML = `<a data-go="me">${icon("library")} Library</a><a data-go="settings">${icon("settings")} Settings</a><a data-go="login">${icon("logout")} Logout</a><a href="../index.html">${icon("browse")} All variants</a>`;
applyTheme();
draw();
Router.start(render);
