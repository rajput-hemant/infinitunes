const IC = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  skipB: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  skipF: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  sliders: '<line x1="4" x2="20" y1="7" y2="7"/><line x1="4" x2="20" y1="17" y2="17"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const S = {
  np: { t: "Billie Jean", a: "Michael Jackson", i: MOCK.song.img, d: 293 },
  playing: false, prog: 0, likes: new Set(), base: null, user: false,
  tab: { artist: "overview", me: "playlists", search: "all" }, lang: "All", renaming: false, showPw: false, follow: false,
  playlists: [{ id: "road-trip", name: "Road Trip" }, { id: "focus", name: "Focus Mode" }, { id: "gym", name: "Gym Hits" }],
  set: { mode: "light", theme: "rose", radius: "0.5", langs: ["Hindi", "English"], stream: "160kbps", dl: "320kbps", img: "high", kb: true },
};

const secs = (d) => { const p = d.split(":").map(Number); return p[0] * 60 + p[1]; };
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const pic = (p, s = 150) => MOCK.img(p, s);
const pa = (t, a, i, d) => `data-play data-t="${esc(t)}" data-a="${esc(a)}" data-i="${esc(i || "")}" data-d="${esc(d || "04:00")}"`;
const ib = (n, label = n) => `<button class="ib" aria-label="${label}">${icon(n, 16)}</button>`;
const like = (k) => `<button class="ib${S.likes.has(k) ? " on" : ""}" data-like="${esc(k)}" aria-label="Like">${icon("heart", 16)}</button>`;

const card = (go, im, t, s, round) => `<a class="card${round ? " round" : ""}" data-go="${go}"><img src="${im}" alt="" loading="lazy"><b>${esc(t)}</b><span>${esc(s)}</span></a>`;
const albumCard = (a) => card("album/" + a.id, pic(a.img), a.title, a.subtitle);
const plCard = (p, go = "playlist/") => card(go + p.id, pic(p.img, 500), p.title, p.subtitle);
const artCard = (a) => card("artist/" + a.id, pic(a.img), a.name, a.listeners + " listeners", true);
const songCard = (n) => card("song/" + n.id, pic(n.img), n.title, n.subtitle);
const shelf = (title, more, items) => `<section class="sec"><div class="sh"><h2>${title}</h2>${more ? `<a data-go="${more}">See all</a>` : ""}</div><div class="shelf">${items}</div></section>`;
const chips = (arr, cur, attr) => `<div class="chips">${arr.map((c) => `<button class="chip${c === cur ? " on" : ""}" ${attr}="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
const tabs = (arr, cur, key) => `<div class="tabs">${arr.map(([v, l]) => `<button class="tab${v === cur ? " on" : ""}" data-tab="${key}:${v}">${l}</button>`).join("")}</div>`;
const row = (i, t, a, d, im, extra = "") => `<div class="row${im ? "" : " noimg"}" ${pa(t, a, im, d)}><span class="idx">${i}</span>${im ? `<img src="${pic(im)}" alt="">` : ""}<div class="rt"><b>${esc(t)}</b><span>${esc(a)}</span></div><span class="dur">${d}</span><span class="acts">${like(t)}${ib("more")}</span></div>`;
const linkRow = (go, im, t, s) => `<a class="row link" data-go="${go}"><img src="${pic(im, 150)}" alt=""><div class="rt"><b>${esc(t)}</b><span>${esc(s)}</span></div>${icon("chevR", 16)}</a>`;
const hdr = (o) => `<div class="hdr"><img class="hart${o.round ? " round" : ""}" src="${o.img}" alt=""><div class="hinfo"><span class="kind">${o.kind}</span><h1>${esc(o.title)}</h1><p class="meta">${o.meta}</p><div class="hact"><button class="pill" ${o.play}>${icon("play", 14)} Play</button>${o.follow || ""}${like(o.title)}${ib("download")}${ib("more")}</div></div></div>`;
const trackRows = (img_) => MOCK.albumTracks.map((t, i) => row(i + 1, t[0], t[1], t[2], img_)).join("");
const nrRows = () => MOCK.newReleases.map((n, i) => row(i + 1, n.title, n.subtitle, n.duration, n.img)).join("");
const find = (arr, id) => arr.find((x) => x.id === id) || arr[0];
const modalOf = (r) => (r.name === "login" || r.name === "signup" ? r.name : "");

const tiles = [["albums", "Albums", "music"], ["playlists", "Playlists", "library"], ["artists", "Artists", "user"], ["chart", "Charts", "chart"], ["shows", "Podcasts", "mic"], ["radio", "Radio", "radio"]];
const tilesHtml = () => `<div class="tiles">${tiles.map(([g, l, ic]) => `<a class="tile" data-go="${g}">${icon(ic, 18)}${l}</a>`).join("")}</div>`;

const pages = {
  home() {
    const h = new Date().getHours();
    const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return `<h1>${g}, ${MOCK.user.name}</h1><p class="sub">Pick up where you left off.</p>
    ${shelf("Trending", "playlists", MOCK.playlists.slice(0, 5).map((p) => plCard(p)).join("") + MOCK.albums.slice(0, 4).map(albumCard).join(""))}
    ${shelf("New Releases", "albums", MOCK.newReleases.map(songCard).join(""))}
    ${shelf("Top Charts", "chart", MOCK.charts.map((c) => card("playlist/" + c.id, pic(c.img, 500), c.title, c.subtitle)).join(""))}
    ${shelf("Top Artists", "artists", MOCK.artists.map(artCard).join(""))}
    ${shelf("Top Playlists", "playlists", MOCK.playlists.slice(5).map((p) => plCard(p)).join(""))}
    <section class="sec"><div class="sh"><h2>Languages</h2></div><div class="chips">${MOCK.languages.map((l) => `<button class="chip" data-lang="${l}">${l}</button>`).join("")}</div></section>`;
  },
  browse() {
    return `<h1>Browse</h1><p class="sub">Everything in one place.</p>${tilesHtml()}<section class="sec"><div class="sh"><h2>Languages</h2></div><div class="chips">${MOCK.languages.map((l) => `<button class="chip" data-lang="${l}">${l}</button>`).join("")}</div></section>`;
  },
  albums() {
    const list = S.lang === "All" ? MOCK.albums : MOCK.albums.filter((a) => a.img.includes(S.lang));
    return `<h1>Albums</h1>${chips(["All", ...MOCK.languages.slice(0, 8), "Spanish"], S.lang, "data-lang")}<div class="grid" style="margin-top:12px">${list.map(albumCard).join("") || '<p class="empty">No albums for this language yet.</p>'}</div>`;
  },
  playlists: () => `<h1>Playlists</h1><div class="grid" style="margin-top:16px">${MOCK.playlists.map((p) => plCard(p)).join("")}</div>`,
  artists: () => `<h1>Artists</h1><div class="grid" style="margin-top:16px">${MOCK.artists.map(artCard).join("")}</div>`,
  radio: () => `<h1>Radio</h1><div class="grid" style="margin-top:16px">${MOCK.radio.map((r, i) => `<a class="card" ${pa(r, "Radio", MOCK.playlists[i].img)}><img src="${pic(MOCK.playlists[i].img, 500)}" alt=""><b>${r}</b><span>Live station</span></a>`).join("")}</div>`,
  shows: () => `<h1>Podcasts</h1><div class="grid" style="margin-top:16px">${MOCK.shows.map((s) => card("show/" + s.id, pic(s.img, 500), s.title, s.subtitle)).join("")}</div>`,
  chart: () => `<h1>Charts</h1><p class="sub">Updated weekly.</p><div class="list">${MOCK.charts.map((c) => linkRow("playlist/" + c.id, c.img, c.title, c.subtitle)).join("")}</div>`,
  album(r) {
    const a = find(MOCK.albums, r.params[0]);
    return hdr({ img: pic(a.img, 500), kind: "Album", title: a.title, meta: `${esc(a.subtitle)} &middot; ${a.year} &middot; 13 songs, 57 min`, play: pa(MOCK.albumTracks[0][0], MOCK.albumTracks[0][1], a.img, "03:56") }) + `<div class="list" style="margin-top:24px">${trackRows(a.img)}</div>`;
  },
  playlist(r) {
    const p = [...MOCK.playlists, ...MOCK.charts].find((x) => x.id === r.params[0]) || MOCK.playlists[0];
    return hdr({ img: pic(p.img, 500), kind: "Playlist", title: p.title, meta: `${esc(p.subtitle)} &middot; ${MOCK.newReleases.length} songs`, play: pa(MOCK.newReleases[0].title, MOCK.newReleases[0].subtitle, MOCK.newReleases[0].img, MOCK.newReleases[0].duration) }) + `<div class="list" style="margin-top:24px">${nrRows()}</div>`;
  },
  song(r) {
    const n = MOCK.newReleases.find((x) => x.id === r.params[0]);
    const s = n ? { title: n.title, artist: n.subtitle, album: n.title, img: n.img, duration: n.duration, plays: "320K", year: 2026, language: "Mixed" } : MOCK.song;
    const al = MOCK.albums[0];
    return hdr({ img: pic(s.img, 500), kind: "Song", title: s.title, meta: `${esc(s.artist)} &middot; ${esc(s.album)} &middot; ${s.year} &middot; ${s.duration} &middot; ${s.plays} plays`, play: pa(s.title, s.artist, s.img, s.duration) })
      + `<section class="sec"><h2>Lyrics</h2><p class="lyrics">Lyrics are not available for this preview.<br>Line one placeholder<br>Line two placeholder<br>Line three placeholder</p></section>`
      + shelf(`More from ${al.title}`, "album/" + al.id, MOCK.albumTracks.slice(5, 11).map((t) => `<a class="card" ${pa(t[0], t[1], al.img, t[2])}><img src="${pic(al.img)}" alt=""><b>${esc(t[0])}</b><span>${esc(t[1])}</span></a>`).join(""));
  },
  show(r) {
    const s = find(MOCK.shows, r.params[0]);
    return hdr({ img: pic(s.img, 500), kind: "Podcast", title: s.title, meta: `${s.subtitle} &middot; ${MOCK.episodes.length} episodes`, play: pa(MOCK.episodes[0][0], s.title, s.img, MOCK.episodes[0][2]) })
      + `<div class="list" style="margin-top:24px">${MOCK.episodes.map((e, i) => `<div class="row" data-go="episode/${i}"><span class="idx">${i + 1}</span><img src="${pic(s.img)}" alt=""><div class="rt"><b>${e[0]}</b><span>${e[1]}</span></div><span class="dur">${e[2]}</span><span class="acts">${like(e[0])}</span></div>`).join("")}</div>`;
  },
  episode(r) {
    const e = MOCK.episodes[+r.params[0]] || MOCK.episodes[0], s = MOCK.shows[0];
    return hdr({ img: pic(s.img, 500), kind: "Episode", title: e[0], meta: `${s.title} &middot; ${e[1]} &middot; ${e[2]}`, play: pa(e[0], s.title, s.img, e[2]) }) + `<section class="sec"><h2>About this episode</h2><p class="lyrics">A calm devotional listen. Episode notes are placeholder text in this preview.</p></section>`;
  },
  artist(r) {
    const a = find(MOCK.artists, r.params[0]), t = S.tab.artist;
    const songs = MOCK.artistSongs.map((x, i) => row(i + 1, x[0], x[1], x[2], x[3])).join("");
    const body = t === "songs" ? `<div class="list">${songs}</div>`
      : t === "albums" ? `<div class="grid" style="margin-top:16px">${MOCK.albums.slice(0, 6).map(albumCard).join("")}</div>`
      : t === "bio" ? `<p class="bio">${a.name} is one of the most listened to artists on infinitunes with ${a.listeners} monthly listeners. This biography is placeholder text for the mockup.</p>`
      : `<section class="sec"><div class="sh"><h2>Top songs</h2><a data-tab="artist:songs">See all</a></div><div class="list">${songs}</div></section>${shelf("Albums", "", MOCK.albums.slice(0, 5).map(albumCard).join(""))}`;
    const fol = `<button class="btn${S.follow ? " primary" : ""}" data-follow>${S.follow ? "Following" : "Follow"}</button>`;
    return hdr({ img: pic(a.img, 500), round: 1, kind: "Artist", title: a.name, meta: `${a.listeners} monthly listeners`, play: pa(MOCK.artistSongs[0][0], a.name, MOCK.artistSongs[0][3], "06:02"), follow: fol }) + tabs([["overview", "Overview"], ["songs", "Songs"], ["albums", "Albums"], ["bio", "Biography"]], t, "artist") + body;
  },
  search(r) {
    const q = r.params.join("/");
    if (!q) return `<h1>Search</h1><section class="sec"><div class="sh"><h2>Recent searches</h2></div><div class="list">${MOCK.recentSearches.map((s) => `<a class="row link" data-go="search/${encodeURIComponent(s)}"><span class="ib">${icon("clock", 16)}</span><div class="rt"><b>${esc(s)}</b></div>${icon("chevR", 16)}</a>`).join("")}</div></section><section class="sec"><div class="sh"><h2>Browse all</h2></div>${tilesHtml()}</section>`;
    const l = q.toLowerCase(), m = (...x) => x.some((v) => v.toLowerCase().includes(l));
    const songs = [...MOCK.newReleases.map((n) => [n.title, n.subtitle, n.duration, n.img]), ...MOCK.albumTracks.map((t) => [t[0], t[1], t[2], MOCK.albums[0].img]), ...MOCK.artistSongs].filter((x) => m(x[0], x[1]));
    const al = MOCK.albums.filter((x) => m(x.title, x.subtitle)), ar = MOCK.artists.filter((x) => m(x.name)), pl = MOCK.playlists.filter((x) => m(x.title));
    const f = S.tab.search, show = (k) => f === "all" || f === k;
    const top = ar[0] ? artCard(ar[0]) : al[0] ? albumCard(al[0]) : pl[0] ? plCard(pl[0]) : songs[0] ? `<div class="card" ${pa(songs[0][0], songs[0][1], songs[0][3], songs[0][2])}><img src="${pic(songs[0][3])}" alt=""><b>${esc(songs[0][0])}</b><span>${esc(songs[0][1])}</span></div>` : "";
    const sec = (k, t, inner, n) => (show(k) && n ? `<section class="sec"><div class="sh"><h2>${t}</h2></div>${inner}</section>` : "");
    const out = (f === "all" && top ? `<section class="sec"><div class="sh"><h2>Top result</h2></div>${top}</section>` : "")
      + sec("songs", "Songs", `<div class="list">${songs.slice(0, 8).map((x, i) => row(i + 1, x[0], x[1], x[2], x[3])).join("")}</div>`, songs.length)
      + sec("albums", "Albums", `<div class="shelf">${al.map(albumCard).join("")}</div>`, al.length)
      + sec("artists", "Artists", `<div class="shelf">${ar.map(artCard).join("")}</div>`, ar.length)
      + sec("playlists", "Playlists", `<div class="shelf">${pl.map((p) => plCard(p)).join("")}</div>`, pl.length);
    const none = !(songs.length + al.length + ar.length + pl.length);
    return `<h1>Results for "${esc(q)}"</h1><div style="margin-top:12px">${chips(["all", "songs", "albums", "artists", "playlists"].map((c) => c), f, "data-stab").replace(/>(all|songs|albums|artists|playlists)</g, (_, w) => `>${w[0].toUpperCase() + w.slice(1)}<`)}</div>${none ? `<p class="empty">No results found. Try another search.</p>` : out}`;
  },
  me(r) {
    if (r.params[0] === "playlist") return pages.userPlaylist(r);
    const t = r.params[0] || "playlists";
    const tl = [["playlists", "My Playlists"], ["recent", "Recently Played"], ["songs", "Liked Songs"], ["albums", "Liked Albums"], ["liked-playlists", "Liked Playlists"], ["artists", "Liked Artists"], ["podcasts", "Liked Podcasts"]];
    const body = {
      playlists: `<div class="list">${S.playlists.map((p) => linkRow("me/playlist/" + p.id, MOCK.playlists[0].img, p.name, "Playlist by you")).join("") || '<p class="empty">No playlists yet.</p>'}</div>`,
      recent: `<div class="list">${nrRows()}</div>`,
      songs: `<div class="list">${trackRows(MOCK.albums[0].img)}</div>`,
      albums: `<div class="grid" style="margin-top:16px">${MOCK.albums.slice(0, 5).map(albumCard).join("")}</div>`,
      "liked-playlists": `<div class="grid" style="margin-top:16px">${MOCK.playlists.slice(0, 4).map((p) => plCard(p)).join("")}</div>`,
      artists: `<div class="grid" style="margin-top:16px">${MOCK.artists.slice(0, 5).map(artCard).join("")}</div>`,
      podcasts: `<div class="grid" style="margin-top:16px">${MOCK.shows.map((s) => card("show/" + s.id, pic(s.img, 500), s.title, s.subtitle)).join("")}</div>`,
    }[t] || "";
    return `<div class="prof"><div class="bigav">H</div><div class="grow"><h1>${MOCK.user.name}</h1><p class="sub">${MOCK.user.email}</p></div><button class="btn" data-go="settings">Edit</button><button class="btn" data-go="login">Logout</button></div>
    <div class="tabs">${tl.map(([v, l]) => `<a class="tab${v === t ? " on" : ""}" data-go="me/${v}">${l}</a>`).join("")}</div><div style="margin-top:12px">${body}</div>`;
  },
  userPlaylist(r) {
    const p = S.playlists.find((x) => x.id === r.params[1]);
    if (!p) return `<p class="empty">Playlist not found.</p>`;
    const rename = S.renaming ? `<input class="input" id="rn" value="${esc(p.name)}" style="width:220px"><button class="btn primary" data-rename-save="${p.id}">Save</button>` : `<button class="btn" data-rename>${icon("pencil", 14)} Rename</button>`;
    return hdr({ img: pic(MOCK.playlists[6].img, 500), kind: "Your playlist", title: p.name, meta: "4 songs &middot; by you", play: pa(MOCK.newReleases[0].title, MOCK.newReleases[0].subtitle, MOCK.newReleases[0].img, MOCK.newReleases[0].duration) })
      + `<div class="hact" style="margin-top:16px">${rename}<button class="btn danger" data-del="${p.id}">${icon("trash", 14)} Delete</button></div><div class="list" style="margin-top:16px">${MOCK.newReleases.slice(0, 4).map((n, i) => row(i + 1, n.title, n.subtitle, n.duration, n.img)).join("")}</div>`;
  },
  settings(r) {
    const sub = r.params[0] || "account", s = S.set;
    const nav = [["Account", "settings", ["Edit Profile", "Change Password", "Delete Account"]], ["Appearance", "settings/appearance", ["Mode", "Themes", "Radius"]], ["Preferences", "settings/preferences", ["Language", "Stream Quality", "Download Quality", "Image Quality"]]];
    const sn = nav.map(([g, go, items]) => `<span class="sgt">${g}</span>${items.map((i) => `<a data-go="${go}" class="${(go === "settings" ? "account" : go.split("/")[1]) === sub ? "on" : ""}">${i}</a>`).join("")}`).join("");
    const sel = (k, arr) => `<select class="select" data-q="${k}">${arr.map((o) => `<option${o === s[k] ? " selected" : ""}>${o}</option>`).join("")}</select>`;
    const body = sub === "appearance" ? `<h2>Appearance</h2><p class="sub">Customize how infinitunes looks on your device.</p>
      <div class="field"><label>Theme Mode</label><div class="wrap">${["light", "dark", "system"].map((m) => `<button class="btn sel${s.mode === m ? " on" : ""}" data-mode="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join("")}</div><p class="help">Select light, dark or follow your system.</p></div>
      <div class="field"><label>Themes</label><div class="wrap">${MOCK.themes.map(([n, c]) => `<button class="btn sel${s.theme === n ? " on" : ""}" data-theme="${n}"><span class="dot" style="background:${c}"></span>${n[0].toUpperCase() + n.slice(1)}</button>`).join("")}</div></div>
      <div class="field"><label>Radius</label><div class="wrap">${MOCK.radii.map((x) => `<button class="btn sel${s.radius === x ? " on" : ""}" data-radius="${x}">${x}</button>`).join("")}</div></div>`
    : sub === "preferences" ? `<h2>Preferences</h2><p class="sub">Language and playback options.</p>
      <div class="field"><label>Languages</label><div class="wrap">${MOCK.languages.map((l) => `<button class="chip${s.langs.includes(l) ? " on" : ""}" data-pl="${l}">${l}</button>`).join("")}</div><p class="help">Choose the languages for your recommendations.</p><button class="btn primary" style="margin-top:12px" data-toast="Preferences saved">Save Preferences</button></div>
      <hr><h2>Quality Settings</h2>
      <div class="qrow"><span class="muted">Stream Quality</span>${sel("stream", MOCK.qualities.stream)}</div>
      <div class="qrow"><span class="muted">Download Quality</span>${sel("dl", MOCK.qualities.stream)}</div>
      <div class="qrow"><span class="muted">Image Quality</span>${sel("img", MOCK.qualities.image)}</div>
      <hr><h2>Keyboard</h2><div class="qrow" style="border:0"><div><div>Keyboard shortcuts</div><p class="help">Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume.</p></div><button class="switch${s.kb ? " on" : ""}" role="switch" aria-checked="${s.kb}" data-kb></button></div>`
    : `<h2>Account Settings</h2><p class="sub">This is how others will see you on the site.</p>
      <div class="acc"><form data-toast="Changes saved">
        <div class="field"><label>Name</label><input class="input" value="${MOCK.user.name}"><p class="help">Your public display name.</p></div>
        <div class="field"><label>Email</label><input class="input" type="email" value="${MOCK.user.email}"><p class="help">Used for sign in and notifications.</p></div>
        <div class="field"><label>Current Password</label><input class="input" type="password" placeholder="Current password"><p class="help">Required only when changing your password.</p></div>
        <div class="field"><label>New Password</label><div class="pwrap"><input class="input" id="npw" type="${S.showPw ? "text" : "password"}" placeholder="New password"><button type="button" class="ib" data-showpw aria-label="Show password">${icon("eye", 16)}</button></div><p class="help">Use at least 8 characters.</p></div>
        <button class="btn primary" style="margin-top:16px">Save Changes</button></form><div class="bigav">H</div></div>
      <hr><h2>Passkeys</h2><p class="sub">Sign in without a password using your device.</p><button class="btn" style="margin-top:12px" data-toast="Passkey added">${icon("key", 14)} Add passkey</button>
      <hr><h2>Delete Account</h2><div class="danger-box"><p class="help" style="margin:0 0 10px">Permanently delete your account and all data. This cannot be undone.</p><button class="btn danger" data-go="login">Delete Account</button></div>`;
    return `<h1>Settings</h1><p class="sub">Manage your account, appearance, and preference settings.</p><div class="set"><nav class="snav">${sn}</nav><div class="sbody">${body}</div></div>`;
  },
};

const authModal = (kind) => {
  const su = kind === "signup";
  return `<div class="backdrop" data-back></div><div class="dialog" role="dialog" aria-modal="true"><button class="ib x" data-back aria-label="Close">${icon("x", 16)}</button>
  <h2>${su ? "Create an account" : "Welcome back"}</h2><p class="sub">${su ? "Sign up to save your music." : "Log in to continue listening."}</p>
  <form data-auth><div class="field"><label>Email</label><input class="input" type="email" placeholder="you@example.com" required></div>
  <div class="field"><label>Password</label><input class="input" type="password" placeholder="Password" required></div>
  ${su ? '<div class="field"><label>Confirm password</label><input class="input" type="password" placeholder="Confirm password" required></div>' : ""}
  <button class="btn primary block" style="margin-top:16px">${su ? "Sign Up" : "Login with Email"}</button></form>
  ${su ? "" : '<button class="btn block" data-toast="Passkey sign in">Sign in with passkey</button>'}
  <div class="or">or continue with</div><div class="two"><button class="btn" data-go="home">Google</button><button class="btn" data-go="home">GitHub</button></div>
  <p class="help" style="margin-top:14px;text-align:center">${su ? 'Already have an account? <a class="lnk" data-go="login">Log in</a>' : 'No account? <a class="lnk" data-go="signup">Sign up</a> &middot; <a class="lnk" data-toast="Reset link sent">Forgot password?</a>'}</p></div>`;
};

const mainNav = [["home", "Home", "home"], ["search", "Search", "search"], ["browse", "Browse", "compass"], ["chart", "Charts", "chart"], ["shows", "Podcasts", "mic"], ["radio", "Radio", "radio"]];
const libNav = [["me/recent", "Recently Played", "clock"], ["me/songs", "Liked Songs", "heart"]];
const navHtml = (arr) => arr.map(([go, l, ic]) => `<a data-go="${go}" href="#/${go}">${icon(ic, 18)}${l}</a>`).join("");

function chrome() {
  $("#nav-main").innerHTML = navHtml(mainNav);
  $("#nav-lib").innerHTML = navHtml(libNav);
  $("#newpl").innerHTML = icon("plus", 14) + " New playlist";
  $("#b-back").innerHTML = icon("chevL");
  $("#b-fwd").innerHTML = icon("chevR");
  $("#s-ico").innerHTML = icon("search", 16);
  $("#p-vol").innerHTML = icon("volume", 16);
  $("#p-prev").innerHTML = $("#sh-prev").innerHTML = icon("skipB", 16);
  $("#p-next").innerHTML = $("#sh-next").innerHTML = icon("skipF", 16);
  $("#sh-close").innerHTML = icon("chevD", 22);
  $("#tabbar").innerHTML = [["home", "Home", "home"], ["search", "Search", "search"], ["me", "Library", "library"], ["settings", "Settings", "sliders"]].map(([g, l, ic]) => `<a data-go="${g}" href="#/${g}">${icon(ic, 20)}${l}</a>`).join("");
}

function sidebarState(r) {
  $$("#side .nav a").forEach((a) => a.classList.toggle("on", a.dataset.go === r.path || (!a.dataset.go.includes("/") && a.dataset.go === r.name)));
  $("#pls").innerHTML = S.playlists.map((p) => `<a data-go="me/playlist/${p.id}" class="${r.path === "me/playlist/" + p.id ? "on" : ""}">${esc(p.name)}</a>`).join("");
  $$("#tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.go === r.name));
}

function render(r) {
  const m = modalOf(r);
  if (!m) S.base = r;
  const b = m ? S.base || { name: "home", params: [], path: "home" } : r;
  if (!m) { S.renaming = false; S.tab.search = r.name === "search" && S.lastQ !== r.path ? "all" : S.tab.search; S.lastQ = r.path; }
  $("#view").innerHTML = (pages[b.name] || pages.home)(b) + (m ? authModal(m) : "");
  sidebarState(b);
  $("#gsearch").value = b.name === "search" ? b.params.join("/") : "";
  document.title = "infinitunes - A Library Sidebar";
}
const rerender = () => render(Router.current());

function applyTheme() {
  const s = S.set, root = document.documentElement;
  root.classList.toggle("dark", s.mode === "dark" || (s.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
  root.style.setProperty("--primary", MOCK.themes.find((t) => t[0] === s.theme)[1]);
  root.style.setProperty("--radius", s.radius + "rem");
}

function updatePlayer() {
  const n = S.np;
  $("#pl-img").src = $("#sh-img").src = n.i ? pic(n.i, 500) : "";
  $("#pl-t").textContent = $("#sh-t").textContent = n.t;
  $("#pl-a").textContent = $("#sh-a").textContent = n.a;
  $$("[data-pp]").forEach((b) => (b.innerHTML = icon(S.playing ? "pause" : "play", b.classList.contains("mpp") ? 18 : 18)));
  $$(".durt").forEach((e) => (e.textContent = fmt(n.d)));
  tick(0);
}
function tick(step) {
  S.prog = Math.min(S.np.d, S.prog + step);
  if (S.prog >= S.np.d) { S.prog = 0; S.playing = false; updatePlayer(); return; }
  $$(".fillbar i").forEach((i) => (i.style.width = (S.prog / S.np.d) * 100 + "%"));
  $$(".cur").forEach((e) => (e.textContent = fmt(S.prog)));
}
const play = (t, a, i, d) => { S.np = { t, a, i, d: secs(d || "04:00") }; S.prog = 0; S.playing = true; updatePlayer(); };
setInterval(() => S.playing && tick(1), 1000);

function toast(m) {
  const e = document.createElement("div");
  e.className = "toast"; e.textContent = m; document.body.append(e);
  setTimeout(() => e.remove(), 1800);
}

document.addEventListener("click", (e) => {
  const t = e.target, c = (s) => t.closest(s);
  const menu = $("#menu");
  if (c("[data-menu]")) menu.classList.toggle("open");
  else menu.classList.remove("open");
  let x;
  if ((x = c("[data-like]"))) { const k = x.dataset.like; S.likes.has(k) ? S.likes.delete(k) : S.likes.add(k); $$("[data-like]").forEach((b) => b.dataset.like === k && b.classList.toggle("on", S.likes.has(k))); return; }
  if (c(".acts") || c(".ib[aria-label=More]")) return;
  if ((x = c("[data-play]"))) { const d = x.dataset; play(d.t, d.a, d.i, d.d); return; }
  if (c("[data-pp]")) { S.playing = !S.playing; updatePlayer(); return; }
  if (c("[data-skip]")) { S.prog = 0; tick(0); return; }
  if (c("[data-np-open]") && matchMedia("(max-width:767px)").matches) $("#sheet").classList.add("open");
  if (c("[data-np-close]")) $("#sheet").classList.remove("open");
  if ((x = c("[data-tab]"))) { const [k, v] = x.dataset.tab.split(":"); S.tab[k] = v; rerender(); return; }
  if ((x = c("[data-stab]"))) { S.tab.search = x.dataset.stab; rerender(); return; }
  if ((x = c("[data-lang]"))) { S.lang = x.dataset.lang; Router.current().name === "albums" ? rerender() : Router.go("albums"); return; }
  if ((x = c("[data-mode]"))) { S.set.mode = x.dataset.mode; applyTheme(); rerender(); return; }
  if ((x = c("[data-theme]"))) { S.set.theme = x.dataset.theme; applyTheme(); rerender(); return; }
  if ((x = c("[data-radius]"))) { S.set.radius = x.dataset.radius; applyTheme(); rerender(); return; }
  if ((x = c("[data-pl]"))) { const l = x.dataset.pl, a = S.set.langs; a.includes(l) ? a.splice(a.indexOf(l), 1) : a.push(l); rerender(); return; }
  if (c("[data-kb]")) { S.set.kb = !S.set.kb; rerender(); return; }
  if (c("[data-showpw]")) { S.showPw = !S.showPw; $("#npw").type = S.showPw ? "text" : "password"; return; }
  if (c("[data-follow]")) { S.follow = !S.follow; rerender(); return; }
  if (c("[data-rename]")) { S.renaming = true; rerender(); return; }
  if ((x = c("[data-rename-save]"))) { S.playlists.find((p) => p.id === x.dataset.renameSave).name = $("#rn").value || "Untitled"; S.renaming = false; rerender(); return; }
  if ((x = c("[data-del]"))) { S.playlists = S.playlists.filter((p) => p.id !== x.dataset.del); Router.go("me/playlists"); return; }
  if (c("#newpl")) { const id = "pl" + Date.now(); S.playlists.push({ id, name: "New playlist " + S.playlists.length }); Router.go("me/playlist/" + id); return; }
  if (c("#b-fwd")) { history.forward(); return; }
  if ((x = c("[data-toast]")) && !x.matches("form")) toast(x.dataset.toast);
});

document.addEventListener("change", (e) => {
  const s = e.target.closest("[data-q]");
  if (s) S.set[s.dataset.q] = s.value;
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.matches("[data-auth]")) Router.go("home");
  else toast(e.target.dataset.toast || "Saved");
});
$("#gsearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.value.trim()) { S.tab.search = "all"; Router.go("search/" + encodeURIComponent(e.target.value.trim())); }
});

chrome();
applyTheme();
updatePlayer();
Router.start(render);
