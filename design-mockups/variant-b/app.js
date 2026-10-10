const P = {
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  prev: '<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" x2="5" y1="19" y2="5"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" x2="19" y1="5" y2="19"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
};
const icon = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const im = (p, s = 150) => MOCK.img(p, s);

const S = { dark: false, mode: "light", theme: "rose", radius: "0.5", langs: ["Hindi", "English"], kb: true, q: { stream: "160kbps", download: "320kbps", image: "high" }, lang: "", artistTab: "overview", searchTab: "all", liked: {}, following: false, rename: false, plName: "Road Trip", showPw: false };
const play = { t: "Billie Jean", a: "Michael Jackson", i: MOCK.song.img, d: "04:53", on: false, pct: 0 };
const AL = MOCK.albums[0].img;
const albumRows = MOCK.albumTracks.map((x) => ({ t: x[0], a: x[1], d: x[2], i: AL }));
const newRows = MOCK.newReleases.map((x) => ({ t: x.title, a: x.subtitle, d: x.duration, i: x.img, go: "song/" + x.id }));
const artistRows = MOCK.artistSongs.map((x) => ({ t: x[0], a: x[1], d: x[2], i: x[3] }));
const secs = (d) => { const [m, s] = d.split(":").map(Number); return m * 60 + s; };
const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

const pa = (t) => `data-play data-t="${esc(t.t)}" data-a="${esc(t.a)}" data-i="${esc(t.i)}" data-d="${t.d || "03:30"}"`;
const back = () => `<button class="back" data-back>${icon("back")}Back</button>`;
const head = (h, s) => `<div class="backrow">${back()}</div><div class="ph"><h1>${h}</h1>${s ? `<p class="sub">${s}</p>` : ""}</div>`;
const page = (inner) => `<div class="wrap pg">${inner}</div>`;
const card = (go, i, t, s, round, size = 500) => `<a class="card${round ? " round" : ""}" data-go="${go}" href="#/${go}"><div class="art"><img loading="lazy" src="${im(i, size)}" alt=""></div><b>${esc(t)}</b><span>${esc(s)}</span></a>`;
const sec = (title, more, body, shelf = true) => `<section class="sec"><div class="sh"><h2>${title}</h2>${more ? `<a data-go="${more}" href="#/${more}">See all</a>` : ""}</div><div class="${shelf ? "shelf" : "grid"}">${body}</div></section>`;
const chips = (items, on, attr) => `<div class="chips">${items.map((c) => `<button class="chip${c[0] === on ? " on" : ""}" ${attr}="${c[0]}">${c[1]}</button>`).join("")}</div>`;
const liked = (k) => (S.liked[k] ? " liked" : "");

const row = (t, n, o = {}) => `<div class="row${o.go ? "" : ""}" ${o.go ? `data-go="${o.go}"` : pa(t)} data-rt="${esc(t.t)}">
  <span class="n">${n}</span><img loading="lazy" src="${im(t.i)}" alt="">
  <div class="tt"><b>${esc(t.t)}</b><span>${esc(t.a)}</span></div><span class="d">${t.d || ""}</span>
  <div class="acts">${o.go ? `<button class="ib act" ${pa(t)} aria-label="Play">${icon("play")}</button>` : `<button class="ib act lk${liked(t.t)}" data-like="${esc(t.t)}" aria-label="Like">${icon("heart")}</button>`}<button class="ib act" aria-label="More">${icon("more")}</button></div></div>`;
const rows = (list, o = {}) => `<div class="list">${list.map((t, i) => row(t, i + 1, o.go ? { go: o.go(t, i) } : {})).join("")}</div>`;

const band = (img, eyebrow, title, sub, btns, round, tail = "") => `<div class="band"><img class="bg" src="${im(img, 500)}" alt=""><div class="wrap"><div class="backrow">${back()}</div><div class="bandin"><img class="${round ? "round" : ""}" src="${im(img, 500)}" alt=""><div><div class="eyebrow">${eyebrow}</div><h1>${esc(title)}</h1><p>${sub}</p><div class="btns">${btns}</div></div></div></div></div>${tail}`;
const playBtn = (t, label = "Play") => `<button class="btn pri lg" ${pa(t)}>${icon("play")}${label}</button>`;
const likeBtn = (k) => `<button class="ib${liked(k)}" data-like="${esc(k)}" aria-label="Like">${icon("heart", 18)}</button>`;
const moreBtn = `<button class="ib" aria-label="More">${icon("more", 18)}</button>`;
const find = (list, id) => list.find((x) => x.id === id) || list[0];

function home() {
  const h = MOCK.playlists[0];
  const trend = MOCK.playlists.slice(0, 5).map((p) => card("playlist/" + p.id, p.img, p.title, p.subtitle)).join("") + MOCK.albums.slice(0, 5).map((a) => card("album/" + a.id, a.img, a.title, a.subtitle)).join("");
  return `<div class="wrap">
  <section class="hero"><img class="bg" src="${im(h.img, 500)}" alt=""><div class="hero-in"><img src="${im(h.img, 500)}" alt=""><div><div class="eyebrow">Featured playlist</div><h1>${h.title}</h1><p>${h.subtitle} · Fresh tracks everyone is playing this week</p><div class="btns"><button class="btn pri lg" ${pa(newRows[0])}>${icon("play")}Play</button><button class="btn glass lg" data-go="playlist/${h.id}">View playlist</button></div></div></div></section>
  ${sec("Trending", "playlists", trend)}
  ${sec("New Releases", "albums", MOCK.newReleases.map((n) => card("song/" + n.id, n.img, n.title, n.subtitle)).join(""))}
  ${sec("Top Charts", "chart", MOCK.charts.map((c) => card("playlist/" + c.id, c.img, c.title, c.subtitle)).join(""))}
  ${sec("Top Artists", "artists", MOCK.artists.map((a) => card("artist/" + a.id, a.img, a.name, a.listeners + " listeners", true)).join(""))}
  ${sec("Top Playlists", "playlists", MOCK.playlists.slice(3).map((p) => card("playlist/" + p.id, p.img, p.title, p.subtitle)).join(""))}
  <section class="sec"><div class="sh"><h2>Languages</h2><a data-go="albums" href="#/albums">See all</a></div><div class="chips">${MOCK.languages.map((l) => `<button class="chip" data-go="albums" data-setlang="${l}">${l}</button>`).join("")}</div></section></div>`;
}

function browse() {
  const hub = [["albums", "Albums"], ["playlists", "Playlists"], ["artists", "Artists"], ["radio", "Radio"], ["shows", "Podcasts"], ["chart", "Charts"]];
  return page(`${head("Browse", "Everything in one place")}<div class="tiles">${hub.map((x) => `<a class="tile" data-go="${x[0]}" href="#/${x[0]}">${x[1]}</a>`).join("")}</div>
  <section class="sec"><div class="sh"><h2>Languages</h2></div><div class="chips" style="flex-wrap:wrap">${MOCK.languages.map((l) => `<button class="chip" data-go="albums" data-setlang="${l}">${l}</button>`).join("")}</div></section>`);
}

const grid = (h, s, body, pre = "") => page(`${head(h, s)}${pre}<div class="grid">${body}</div>`);
const albums = () => grid("Albums", "New and popular albums", MOCK.albums.filter((a) => !S.lang || a.img.includes("-" + S.lang + "-")).map((a) => card("album/" + a.id, a.img, a.title, a.subtitle + " · " + a.year)).join("") || '<p class="empty">No albums in this language in the mock data.</p>', `<div style="margin-bottom:20px">${chips([["", "All"]].concat(["Hindi", "English", "Spanish", "Korean"].map((l) => [l, l])), S.lang, "data-lang")}</div>`);
const playlists = () => grid("Playlists", "Curated for every mood", MOCK.playlists.map((p) => card("playlist/" + p.id, p.img, p.title, p.subtitle)).join(""));
const artists = () => grid("Artists", "Top artists right now", MOCK.artists.map((a) => card("artist/" + a.id, a.img, a.name, a.listeners + " listeners", true)).join(""));
const radio = () => grid("Radio", "Stations that never stop", MOCK.radio.map((r, i) => `<a class="card" ${pa({ t: r, a: "Radio", i: MOCK.artists[i].img })}><div class="art"><img src="${im(MOCK.artists[i].img, 500)}" alt=""></div><b>${r}</b><span>Radio</span></a>`).join(""));
const shows = () => grid("Podcasts", "Shows and episodes", MOCK.shows.map((s) => card("show/" + s.id, s.img, s.title, s.subtitle)).join(""));
const chart = () => grid("Charts", "Updated every week", MOCK.charts.map((c) => card("playlist/" + c.id, c.img, c.title, c.subtitle)).join(""));

function album(id) {
  const a = find(MOCK.albums, id);
  return band(a.img, "Album", a.title, `${a.subtitle} · ${a.year} · 13 songs, 57 min`, playBtn(albumRows[0]) + likeBtn("al" + a.id) + moreBtn) + page(rows(albumRows));
}
function playlist(id) {
  const p = find(MOCK.playlists.concat(MOCK.charts), id);
  return band(p.img, "Playlist", p.title, p.subtitle + " · 23 songs", playBtn(newRows[0]) + likeBtn("pl" + p.id) + moreBtn) + page(rows(newRows.concat(albumRows.slice(0, 5))));
}
function song(id) {
  const n = MOCK.newReleases.find((x) => x.id === id);
  const s = MOCK.song, t = n ? { t: n.title, a: n.subtitle, i: n.img, d: n.duration } : { t: s.title, a: s.artist, i: s.img, d: s.duration };
  return `<div class="wrap pg"><div class="backrow">${back()}</div><div class="cols" style="margin-top:12px"><div><div class="bandin" style="color:inherit"><img src="${im(t.i, 500)}" alt="" style="width:240px;height:240px"><div><div class="eyebrow">Song</div><h1>${esc(t.t)}</h1><p class="sub">${esc(t.a)} · ${n ? "" : s.album + " · "}${t.d} · ${s.language} · ${s.plays} plays</p><div class="btns">${playBtn(t)}<button class="ib${liked(t.t)}" data-like="${esc(t.t)}" aria-label="Like" style="color:inherit">${icon("heart", 18)}</button></div></div></div>
  <div class="sec"><div class="sh"><h2>Lyrics</h2></div><div class="lyr">Lyrics are not available in this mockup.<br>Placeholder line one<br>Placeholder line two<br>Placeholder line three</div></div></div>
  <div style="margin-top:12px"><div class="sh"><h2 style="font-size:16px">Details</h2></div><p class="sub">Album: ${s.album}<br>Year: ${s.year}<br>Language: ${s.language}</p></div></div>
  ${sec("More from Michael: Songs From The Motion Picture", "album/michael", albumRows.slice(0, 8).map((r) => `<a class="card" ${pa(r)}><div class="art"><img src="${im(AL, 500)}" alt=""></div><b>${esc(r.t)}</b><span>${r.a}</span></a>`).join(""))}</div>`;
}
function show() {
  const s = MOCK.shows[0], eps = MOCK.episodes.map((e) => ({ t: e[0], a: e[1], d: e[2], i: s.img }));
  return band(s.img, "Podcast", s.title, s.subtitle + " · 5 episodes", playBtn(eps[0], "Play latest") + `<button class="btn glass">${icon("plus")}Follow</button>`) + page(rows(eps, { go: (t, i) => "episode/" + (i + 1) }));
}
function episode(id) {
  const s = MOCK.shows[0], k = Math.min(Math.max(+id || 1, 1), 5) - 1, e = MOCK.episodes[k], t = { t: e[0], a: s.title, d: e[2], i: s.img };
  return band(s.img, "Episode", e[0], `${s.title} · ${e[1]} · ${e[2]}`, playBtn(t) + likeBtn("ep" + k) + moreBtn) + page(`<div class="sh"><h2>About this episode</h2></div><p class="sub" style="max-width:640px">A calm, devotional listen. This is placeholder description text for the episode in the mockup.</p>
  <section class="sec"><div class="sh"><h2>More episodes</h2><a data-go="show/${s.id}" href="#/show/${s.id}">See all</a></div>${rows(MOCK.episodes.map((x) => ({ t: x[0], a: x[1], d: x[2], i: s.img })), { go: (t, i) => "episode/" + (i + 1) })}</section>`);
}
function artist(id) {
  const a = find(MOCK.artists, id), tabs = ["overview", "songs", "albums", "biography"];
  const body = {
    overview: `<div class="sh"><h2>Popular songs</h2></div>${rows(artistRows)}${sec("Albums", "", MOCK.albums.slice(0, 6).map((x) => card("album/" + x.id, x.img, x.title, x.year)).join(""))}`,
    songs: rows(artistRows.concat(artistRows)),
    albums: `<div class="grid">${MOCK.albums.slice(0, 8).map((x) => card("album/" + x.id, x.img, x.title, x.year)).join("")}</div>`,
    biography: `<p class="sub" style="max-width:640px;line-height:1.7">${a.name} is one of the most listened to artists on the platform. This biography is placeholder text for the mockup, describing early life, career highlights and notable collaborations across film and independent music.</p>`,
  }[S.artistTab];
  return band(a.img, "Artist", a.name, a.listeners + " monthly listeners", playBtn(artistRows[0]) + `<button class="btn glass lg" data-follow>${S.following ? "Following" : "Follow"}</button>`, true) +
    page(`<div class="subtabs" style="margin-top:0">${tabs.map((t) => `<a class="${t === S.artistTab ? "on" : ""}" data-atab="${t}" style="text-transform:capitalize">${t}</a>`).join("")}</div>${body}`);
}

function search(q) {
  const input = `<div class="field only-m" style="margin-bottom:12px"><input class="inp" data-search placeholder="Search songs, albums, artists" value="${esc(q || "")}"></div>`;
  if (!q) {
    const cats = ["Hindi", "English", "Punjabi", "Romance", "Party", "Workout", "Devotional", "Lo-Fi"];
    return page(`${head("Search")}${input}<h2 style="font-size:18px;margin-bottom:12px">Recent searches</h2><div class="chips" style="flex-wrap:wrap">${MOCK.recentSearches.map((r) => `<button class="chip" data-go="search/${r}">${r}</button>`).join("")}</div>
    <section class="sec"><div class="sh"><h2>Browse categories</h2></div><div class="tiles">${cats.map((c) => `<a class="tile" data-go="search/${c}" href="#/search/${c}">${c}</a>`).join("")}</div></section>`);
  }
  const l = q.toLowerCase(), m = (s) => s.toLowerCase().includes(l);
  let songs = newRows.concat(albumRows, artistRows).filter((t) => m(t.t) || m(t.a)), als = MOCK.albums.filter((a) => m(a.title) || m(a.subtitle)), ars = MOCK.artists.filter((a) => m(a.name)), pls = MOCK.playlists.filter((p) => m(p.title));
  const sample = !songs.length && !als.length && !ars.length && !pls.length;
  if (sample) { songs = newRows.slice(0, 5); als = MOCK.albums.slice(0, 5); ars = MOCK.artists.slice(0, 5); pls = MOCK.playlists.slice(0, 5); }
  const top = ars[0] ? { go: "artist/" + ars[0].id, i: ars[0].img, t: ars[0].name, s: "Artist", r: 1 } : als[0] ? { go: "album/" + als[0].id, i: als[0].img, t: als[0].title, s: "Album" } : { go: "song/" + (songs[0].go || "").replace("song/", ""), i: songs[0].i, t: songs[0].t, s: "Song" };
  const T = S.searchTab, show = (k) => T === "all" || T === k;
  const blk = (k, h, b) => (show(k) ? `<section class="sec" style="margin-top:28px"><div class="sh"><h2 style="font-size:18px">${h}</h2></div>${b}</section>` : "");
  return page(`${head("Results for “" + esc(q) + "”", sample ? "No exact matches, showing popular picks" : "")}${input}${chips([["all", "All"], ["songs", "Songs"], ["albums", "Albums"], ["artists", "Artists"], ["playlists", "Playlists"]], T, "data-stab")}
  ${show("all") ? `<section class="sec" style="margin-top:28px"><div class="sh"><h2 style="font-size:18px">Top result</h2></div><div style="max-width:200px">${card(top.go, top.i, top.t, top.s, top.r)}</div></section>` : ""}
  ${blk("songs", "Songs", rows(songs.slice(0, 6)))}
  ${blk("albums", "Albums", `<div class="shelf">${als.map((a) => card("album/" + a.id, a.img, a.title, a.subtitle)).join("")}</div>`)}
  ${blk("artists", "Artists", `<div class="shelf">${ars.map((a) => card("artist/" + a.id, a.img, a.name, "Artist", true)).join("")}</div>`)}
  ${blk("playlists", "Playlists", `<div class="shelf">${pls.map((p) => card("playlist/" + p.id, p.img, p.title, p.subtitle)).join("")}</div>`)}`);
}

const MET = [["playlists", "My Playlists"], ["recent", "Recently Played"], ["songs", "Liked Songs"], ["albums", "Liked Albums"], ["lists", "Liked Playlists"], ["artists", "Liked Artists"], ["podcasts", "Liked Podcasts"]];
function me(tab) {
  tab = MET.some((x) => x[0] === tab) ? tab : "playlists";
  const body = {
    playlists: `<div class="grid"><a class="card" data-go="me/playlist/road-trip" href="#/me/playlist/road-trip"><div class="art"><img src="${im(MOCK.playlists[2].img, 500)}" alt=""></div><b>${esc(S.plName)}</b><span>4 songs</span></a><button class="card" style="border:1px dashed var(--line);background:none;border-radius:var(--r2);aspect-ratio:1;display:grid;place-items:center;color:var(--muted)">${icon("plus", 24)}New playlist</button></div>`,
    recent: rows(newRows.slice(0, 6)),
    songs: rows(albumRows.slice(5, 11)),
    albums: `<div class="grid">${MOCK.albums.slice(0, 5).map((a) => card("album/" + a.id, a.img, a.title, a.subtitle)).join("")}</div>`,
    lists: `<div class="grid">${MOCK.playlists.slice(0, 4).map((p) => card("playlist/" + p.id, p.img, p.title, p.subtitle)).join("")}</div>`,
    artists: `<div class="grid">${MOCK.artists.slice(0, 5).map((a) => card("artist/" + a.id, a.img, a.name, a.listeners, true)).join("")}</div>`,
    podcasts: `<div class="grid">${MOCK.shows.map((s) => card("show/" + s.id, s.img, s.title, s.subtitle)).join("")}</div>`,
  }[tab];
  return page(`<div class="backrow">${back()}</div><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:8px 0"><div class="av" style="width:72px;height:72px;font-size:28px;display:grid;place-items:center">${MOCK.user.name[0]}</div><div style="flex:1;min-width:160px"><h1>${MOCK.user.name}</h1><p class="sub">${MOCK.user.email}</p></div><button class="btn" data-go="settings">${icon("edit")}Edit</button><button class="btn" data-go="login">Logout</button></div>
  <div class="subtabs">${MET.map((x) => `<a class="${x[0] === tab ? "on" : ""}" data-go="me/${x[0]}" href="#/me/${x[0]}">${x[1]}</a>`).join("")}</div>${body}`);
}
function userPlaylist() {
  const t = { t: albumRows[6].t, a: albumRows[6].a, i: AL, d: albumRows[6].d };
  const title = S.rename ? `<input class="inp" data-rn value="${esc(S.plName)}" style="width:220px;height:32px">` : esc(S.plName);
  return `<div class="band"><img class="bg" src="${im(MOCK.playlists[2].img, 500)}" alt=""><div class="wrap"><div class="backrow">${back()}</div><div class="bandin"><img src="${im(MOCK.playlists[2].img, 500)}" alt=""><div><div class="eyebrow">Your playlist</div><h1>${S.rename ? title : title}</h1><p>4 songs · by ${MOCK.user.name}</p><div class="btns">${playBtn(t)}<button class="btn glass" data-rename>${icon("edit")}${S.rename ? "Save" : "Rename"}</button><button class="btn glass" data-go="me/playlists">${icon("trash")}Delete</button></div></div></div></div></div>` + page(rows([albumRows[6], albumRows[7], albumRows[8], albumRows[12]]));
}

const SN = [["Account", [["Edit Profile", "settings"], ["Change Password", "settings"], ["Delete Account", "settings"]]], ["Appearance", [["Mode", "settings/appearance"], ["Themes", "settings/appearance"], ["Radius", "settings/appearance"]]], ["Preferences", [["Language", "settings/preferences"], ["Stream Quality", "settings/preferences"], ["Download Quality", "settings/preferences"], ["Image Quality", "settings/preferences"]]]];
function settings(sub) {
  const here = "settings" + (sub ? "/" + sub : "");
  const nav = SN.map((g) => `<div class="g">${g[0]}</div>` + g[1].map((l) => `<a class="${l[1] === here ? "on" : ""}" data-go="${l[1]}" href="#/${l[1]}">${l[0]}</a>`).join("")).join("");
  const sel = (k, l, opts) => `<div class="qrow"><span>${l}</span><select class="inp" data-q="${k}">${opts.map((o) => `<option${S.q[k] === o ? " selected" : ""}>${o}</option>`).join("")}</select></div>`;
  const body = sub === "appearance" ? `<h2>Appearance</h2><p class="sub">Customize how Infinitunes looks on your device.</p>
    <div class="sec2" style="border:0;padding:0;margin-top:20px"><h3>Theme Mode</h3><div class="opts">${["light", "dark", "system"].map((m) => `<button class="btn wide${S.mode === m ? " sel" : ""}" data-mode="${m}" style="text-transform:capitalize">${m}</button>`).join("")}</div></div>
    <div class="sec2"><h3>Themes</h3><div class="opts">${MOCK.themes.map((t) => `<button class="btn wide${S.theme === t[0] ? " sel" : ""}" data-theme="${t[0]}" data-c="${t[1]}"><span class="sw" style="background:${t[1]}"></span>${t[0]}</button>`).join("")}</div></div>
    <div class="sec2"><h3>Radius</h3><div class="opts">${MOCK.radii.map((r) => `<button class="btn wide${S.radius === r ? " sel" : ""}" data-radius="${r}">${r}</button>`).join("")}</div></div>`
    : sub === "preferences" ? `<h2>Preferences</h2><p class="sub">Choose your languages and playback quality.</p>
    <div class="sec2" style="border:0;padding:0;margin-top:20px"><h3>Languages</h3><div class="opts" style="margin-bottom:12px">${MOCK.languages.map((l) => `<button class="chip${S.langs.includes(l) ? " on" : ""}" data-l="${l}">${l}</button>`).join("")}</div><button class="btn pri">Save Preferences</button></div>
    <div class="sec2"><h3>Quality Settings</h3>${sel("stream", "Stream Quality", MOCK.qualities.stream)}${sel("download", "Download Quality", MOCK.qualities.stream)}${sel("image", "Image Quality", MOCK.qualities.image)}</div>
    <div class="sec2"><h3>Keyboard</h3><div class="qrow"><span>Keyboard shortcuts</span><button class="switch${S.kb ? " on" : ""}" data-kb role="switch" aria-label="Keyboard shortcuts"><i></i></button></div><p class="help">Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume.</p></div>`
    : `<h2>Account Settings</h2><p class="sub">This is how others will see you on the site.</p>
    <div class="acct" style="margin-top:20px"><form style="flex:1;max-width:420px">
      <div class="field"><label>Name</label><input class="inp" value="${MOCK.user.name}"><p class="help">Your public display name.</p></div>
      <div class="field"><label>Email</label><input class="inp" value="${MOCK.user.email}"><p class="help">Used for sign in and notifications.</p></div>
      <div class="field"><label>Current Password</label><input class="inp" type="password" placeholder="Current password"><p class="help">Required to change your password.</p></div>
      <div class="field"><label>New Password</label><div class="pw"><input class="inp" type="${S.showPw ? "text" : "password"}" placeholder="New password"><button type="button" class="ib" data-pw aria-label="Show password">${icon("eye")}</button></div><p class="help">At least 8 characters.</p></div>
      <button type="button" class="btn pri">Save Changes</button></form><div class="big">${MOCK.user.name[0]}</div></div>
    <div class="sec2"><h3>Passkeys</h3><p class="help" style="margin:0 0 10px">Sign in without a password using your device.</p><button class="btn">${icon("key")}Add passkey</button></div>
    <div class="sec2"><div class="dz"><div><h3 style="margin:0">Delete Account</h3><p class="help">Permanently remove your account and data.</p></div><button class="btn dng">Delete Account</button></div></div>`;
  return page(`<div class="backrow">${back()}</div><div class="ph"><h1>Settings</h1><p class="sub">Manage your account, appearance, and preference settings.</p></div><div class="set"><nav class="snav">${nav}</nav><div class="sbody">${body}</div></div>`);
}

function auth(kind) {
  const imgs = [MOCK.albums[0], MOCK.albums[1], MOCK.albums[2], MOCK.albums[3], MOCK.albums[4], MOCK.albums[5], MOCK.albums[6], MOCK.albums[7], MOCK.albums[8], MOCK.albums[9], MOCK.albums[10], MOCK.albums[11]];
  const f = (l, t, p) => `<div class="field"><label>${l}</label><input class="inp" type="${t}" placeholder="${p}"></div>`;
  const login = kind === "login";
  return `<div class="split"><div class="coll">${imgs.map((a) => `<img src="${im(a.img, 500)}" alt="">`).join("")}<div class="cap">Music without limits.</div></div>
  <div class="formside"><button class="back" data-back>${icon("back")}Back</button><form class="fbox" data-auth><a class="logo" data-go="home" href="#/home"><span class="dot">${icon("music")}</span>Infinitunes</a>
  <h1>${login ? "Welcome back" : "Create your account"}</h1><p class="sub" style="margin-bottom:20px">${login ? "Sign in to continue listening." : "Start listening in seconds."}</p>
  ${f("Email", "email", "you@example.com")}${login ? `<div class="field"><label style="display:flex;justify-content:space-between">Password<a class="link" href="#/login">Forgot password?</a></label><input class="inp" type="password" placeholder="Password"></div>` : f("Password", "password", "Password") + f("Confirm password", "password", "Confirm password")}
  <button class="btn pri lg">${login ? "Login with Email" : "Sign Up"}</button>
  ${login ? `<button type="button" class="btn" style="margin-top:8px;height:36px">${icon("key")}Sign in with passkey</button>` : ""}
  <div class="or">or continue with</div><div class="two"><button type="button" class="btn">Google</button><button type="button" class="btn">GitHub</button></div>
  <p class="foot">${login ? `No account? <a data-go="signup" href="#/signup">Sign up</a>` : `Have an account? <a data-go="login" href="#/login">Login</a>`}</p></form></div></div>`;
}

function render(r) {
  const n = r.name, id = r.params[0];
  const isAuth = n === "login" || n === "signup";
  document.body.classList.toggle("auth", isAuth);
  const html = {
    home, browse, albums, playlists, artists, radio, shows, chart,
    album: () => album(id), playlist: () => playlist(id), song: () => song(id), show, episode: () => episode(id), artist: () => artist(id),
    search: () => search(r.params.join("/")),
    me: () => (id === "playlist" ? userPlaylist() : me(id)),
    settings: () => settings(id),
    login: () => auth("login"), signup: () => auth("signup"),
  }[n];
  $("#app").innerHTML = (html || home)();
  const group = { home: ["home"], chart: ["chart"], shows: ["shows", "show", "episode"], me: ["me"] };
  const key = Object.keys(group).find((k) => group[k].includes(n)) || (["settings", "login", "signup"].includes(n) ? "" : "browse");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === key));
  closeUi();
  paint();
}
function rerender() { const y = scrollY; render(Router.current()); scrollTo(0, y); }

function closeUi() { $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open"); $("#menu").classList.remove("open"); $("#np").classList.remove("open"); }

function paint() {
  const ic = play.on ? "pause" : "play";
  ["pPlay", "npPlay"].forEach((i) => ($("#" + i).innerHTML = icon(ic, 18)));
  [["pArt", "npArt"]].flat().forEach((i) => ($("#" + i).src = im(play.i, 500)));
  ["pTitle", "npTitle"].forEach((i) => ($("#" + i).textContent = play.t));
  ["pArtist", "npArtist"].forEach((i) => ($("#" + i).textContent = play.a));
  const tot = secs(play.d || "03:30");
  ["pFill", "npFill"].forEach((i) => ($("#" + i).style.width = play.pct + "%"));
  ["pCur", "npCur"].forEach((i) => ($("#" + i).textContent = fmt((play.pct / 100) * tot)));
  ["pDur", "npDur"].forEach((i) => ($("#" + i).textContent = fmt(tot)));
  $("#pLike").className = "ib only-d" + liked(play.t);
  document.querySelectorAll("[data-rt]").forEach((el) => el.classList.toggle("on", el.dataset.rt === play.t));
  document.querySelectorAll("[data-play]").forEach((el) => { const b = el.matches("button.btn,button.ib"); if (b && el.dataset.t === play.t) { /* keep label */ } });
}

setInterval(() => {
  if (!play.on) return;
  play.pct = play.pct >= 100 ? 0 : play.pct + 100 / (secs(play.d || "03:30") * 2);
  paint();
}, 500);

function setPlay(el) {
  const t = el.dataset.t;
  if (t === play.t) play.on = !play.on;
  else Object.assign(play, { t, a: el.dataset.a, i: el.dataset.i, d: el.dataset.d, pct: 0, on: true });
  paint();
}
function skip(d) {
  const i = albumRows.findIndex((x) => x.t === play.t), n = albumRows[(i + d + albumRows.length) % albumRows.length];
  Object.assign(play, { t: n.t, a: n.a, i: n.i, d: n.d, pct: 0, on: true });
  paint();
}

function applyTheme() {
  const dark = S.mode === "dark" || (S.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const c = MOCK.themes.find((t) => t[0] === S.theme)[1];
  document.documentElement.style.setProperty("--primary", c);
  document.documentElement.style.setProperty("--radius", S.radius + "rem");
}

document.addEventListener("click", (e) => {
  const c = (s) => e.target.closest(s);
  const stop = () => e.stopImmediatePropagation();
  let el;
  if (c("#burger")) { $("#drawer").classList.add("open"); $("#scrim").classList.add("open"); return; }
  if (c("#dclose") || c("#scrim")) { closeUi(); return; }
  if (c("#avbtn")) { $("#menu").classList.toggle("open"); return; }
  if (!c(".avwrap")) $("#menu").classList.remove("open");
  if ((el = c("[data-skip]"))) { skip(+el.dataset.skip); return; }
  if (c("#pLike")) { S.liked[play.t] = !S.liked[play.t]; paint(); return; }
  if ((el = c("[data-like]"))) { stop(); S.liked[el.dataset.like] = !S.liked[el.dataset.like]; el.classList.toggle("liked"); paint(); return; }
  if (c("#pPlay") || c("#npPlay")) { play.on = !play.on; paint(); return; }
  if (c("#npClose")) { $("#np").classList.remove("open"); return; }
  if (c("#player") && matchMedia("(max-width:767px)").matches) { $("#np").classList.add("open"); return; }
  if ((el = c("[data-play]"))) { stop(); setPlay(el); return; }
  if ((el = c("[data-setlang]"))) S.lang = el.dataset.setlang;
  if ((el = c("[data-lang]"))) { S.lang = el.dataset.lang; rerender(); return; }
  if ((el = c("[data-stab]"))) { S.searchTab = el.dataset.stab; rerender(); return; }
  if ((el = c("[data-atab]"))) { S.artistTab = el.dataset.atab; rerender(); return; }
  if (c("[data-follow]")) { S.following = !S.following; rerender(); return; }
  if (c("[data-rename]")) { if (S.rename) { const v = $("[data-rn]").value.trim(); if (v) S.plName = v; } S.rename = !S.rename; rerender(); return; }
  if ((el = c("[data-mode]"))) { S.mode = el.dataset.mode; applyTheme(); rerender(); return; }
  if ((el = c("[data-theme]"))) { S.theme = el.dataset.theme; applyTheme(); rerender(); return; }
  if ((el = c("[data-radius]"))) { S.radius = el.dataset.radius; applyTheme(); rerender(); return; }
  if ((el = c("[data-l]"))) { const l = el.dataset.l, i = S.langs.indexOf(l); i < 0 ? S.langs.push(l) : S.langs.splice(i, 1); el.classList.toggle("on"); return; }
  if (c("[data-kb]")) { S.kb = !S.kb; c("[data-kb]").classList.toggle("on", S.kb); return; }
  if (c("[data-pw]")) { S.showPw = !S.showPw; rerender(); return; }
});
document.addEventListener("change", (e) => { const q = e.target.dataset.q; if (q) S.q[q] = e.target.value; });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("[data-search]") && e.target.value.trim()) Router.go("search/" + encodeURIComponent(e.target.value.trim()));
});
document.addEventListener("submit", (e) => { e.preventDefault(); if (e.target.matches("[data-auth]")) Router.go("home"); });
document.addEventListener("keydown", (e) => {
  if (!S.kb || e.target.matches("input,select,textarea") || e.shiftKey) return;
  if (e.code === "Space") { e.preventDefault(); play.on = !play.on; paint(); }
  else if (e.key === "n") skip(1);
  else if (e.key === "p") skip(-1);
  else if (e.key === "l") { S.liked[play.t] = !S.liked[play.t]; paint(); }
  else if (e.key === "s") { const i = $("[data-search]"); if (i) { e.preventDefault(); i.focus(); } }
});

applyTheme();
Router.start(render);
document.querySelectorAll("[data-icon]").forEach((el) => {
  const m = { menu: "menu", search: "search", x: "x", music: "music", prev: "prev", next: "next", heart: "heart", down: "down" }[el.dataset.icon];
  el.innerHTML = icon(m, m === "music" ? 14 : 18);
});
