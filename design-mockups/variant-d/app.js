const $ = (s) => document.querySelector(s);
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  library: '<path d="M3 6h12M3 12h12M3 18h7"/><circle cx="18" cy="17" r="3"/><path d="M21 17V6l-3 1"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',
  pause: '<rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/>',
  more: '<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  prev: '<path d="M19 5v14L8 12z" fill="currentColor"/><path d="M5 5v14"/>',
  next: '<path d="M5 5v14l11-7z" fill="currentColor"/><path d="M19 5v14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  share: '<path d="M12 15V3M7 8l5-5 5 5M5 13v8h14v-8"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  shuffle: '<path d="M3 6h4l10 12h4M3 18h4l3-4M14 10l3-4h4M18 3l3 3-3 3M18 15l3 3-3 3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M3 6h0M3 12h0M3 18h0"/>',
};
const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const S = { mode: "light", theme: "rose", radius: "0.5", langs: new Set(["Hindi", "English"]), kbd: true, stream: "160kbps", dl: "320kbps", img: "high",
  homeLang: "All", albumLang: "All", artistTab: "overview", sf: "all", liked: {}, show: false, renaming: false, plName: "Road Trip", sc: null };
const P = { title: "", artist: "", img: "", playing: false, pct: 0 };
let lastRoute = { name: "home", params: [], path: "home" };
let curRoute = lastRoute;

const ALBUM_ART = MOCK.albums[0].img;
const COLORS = ["#e11d48", "#7c3aed", "#2563eb", "#16a34a", "#f97316", "#0891b2", "#db2777", "#475569"];
const NAV = [["home", "Home", "home", "home"], ["browse", "Browse", "compass", "browse"], ["chart", "Charts", "chart", "chart"], ["me", "Library", "library", "me"], ["settings", "Settings", "settings", "settings"]];
const BROWSE = [["albums", "Albums", "disc"], ["playlists", "Playlists", "list"], ["artists", "Artists", "mic"], ["radio", "Radio", "radio"], ["shows", "Podcasts", "mic"], ["chart", "Charts", "chart"]];
const BROWSE_ACTIVE = { albums: 1, playlists: 1, artists: 1, radio: 1, shows: 1, browse: 1 };

const playAttr = (t, a, i) => `data-play data-t="${esc(t)}" data-a="${esc(a)}" data-i="${esc(i)}"`;
const chips = (list, on, attr) => `<div class="chips">${list.map((c) => `<button class="chip ${c === on ? "on" : ""}" ${attr}="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
const card = (go, item, round) => `<a class="card ${round ? "round" : ""}" data-go="${go}"><img loading="lazy" src="${MOCK.img(item.img, 150)}" alt=""><b>${esc(item.title || item.name)}</b><span>${esc(item.subtitle || item.listeners + " listeners")}</span></a>`;
const shelf = (title, more, html) => `<section class="sec"><div class="sh"><h2>${title}</h2>${more ? `<a data-go="${more}">See all</a>` : ""}</div><div class="shelf">${html}</div></section>`;
const like = (k) => `<button class="ib ${S.liked[k] ? "on" : ""}" data-like="${esc(k)}" aria-label="Like">${icon("heart")}</button>`;
const row = (ix, t, a, d, img, extra = "") => `<div class="row ${P.title === t ? "cur" : ""}" ${playAttr(t, a, img)}>${ix !== "" ? `<span class="ix">${ix}</span>` : ""}<img loading="lazy" src="${MOCK.img(img, 150)}" alt=""><div class="rt"><b>${esc(t)}</b><span>${esc(a)}</span></div><span class="du">${d}</span>${like(t)}<button class="ib" data-more aria-label="More">${icon("more")}</button></div>`;
const trackRows = (list, img) => list.map((t, i) => row(i + 1, t[0], t[1], t[2], t[3] || img)).join("");
const relRows = () => MOCK.newReleases.map((s, i) => row(i + 1, s.title, s.subtitle, s.duration, s.img)).join("");
const grid = (items, kind, round) => `<div class="grid">${items.map((x) => card(`${kind}/${x.id}`, x, round)).join("")}</div>`;
const head = (title, sub) => `<div class="sh"><h1>${title}</h1>${sub || ""}</div>`;
const detailHead = (img, title, meta, acts, round) => `<div class="dh"><img class="${round ? "round" : ""}" src="${MOCK.img(img, 500)}" alt=""><h1>${esc(title)}</h1><div class="muted sm">${meta}</div><div class="acts">${acts}</div></div>`;
const playBtn = (t, a, i) => `<button class="btn pri" ${playAttr(t, a, i)}>${icon("play", 16)} Play</button>`;
const kebab = `<button class="ib" data-more aria-label="More">${icon("more")}</button>`;

function qpTiles() {
  const a = MOCK.newReleases.slice(0, 4).map((s) => `<div class="qt" ${playAttr(s.title, s.subtitle, s.img)}><img src="${MOCK.img(s.img, 150)}" alt=""><b>${esc(s.title)}</b></div>`);
  const b = MOCK.albums.slice(0, 4).map((x) => `<a class="qt" data-go="album/${x.id}"><img src="${MOCK.img(x.img, 150)}" alt=""><b>${esc(x.title)}</b></a>`);
  return a.concat(b).join("");
}
function pHome() {
  return `<div class="hero"><h1>Good evening, ${MOCK.user.name}</h1></div>
  <div class="sbox">${icon("search", 18)}<input type="text" data-search placeholder="Search songs, albums, artists" aria-label="Search"></div>
  ${chips(["All"].concat(MOCK.languages.slice(0, 8)), S.homeLang, "data-hl")}
  <section class="sec"><div class="sh"><h2>Quick picks</h2></div><div class="qp">${qpTiles()}</div></section>
  ${shelf("Trending", "playlists", MOCK.playlists.slice(0, 5).map((x) => card("playlist/" + x.id, x)).join("") + MOCK.albums.slice(0, 5).map((x) => card("album/" + x.id, x)).join(""))}
  ${shelf("New Releases", "albums", MOCK.newReleases.map((x) => card("song/" + x.id, x)).join(""))}
  ${shelf("Top Charts", "chart", MOCK.charts.map((x) => card("playlist/" + x.id, x)).join(""))}
  ${shelf("Top Artists", "artists", MOCK.artists.map((x) => card("artist/" + x.id, x, 1)).join(""))}
  ${shelf("Top Playlists", "playlists", MOCK.playlists.map((x) => card("playlist/" + x.id, x)).join(""))}`;
}
function pBrowse() {
  return `${head("Browse")}<div class="tiles">${BROWSE.map((b, i) => `<a class="tile" style="background:${COLORS[i]}" data-go="${b[0]}">${b[1]}${icon(b[2], 28)}</a>`).join("")}</div>
  <section class="sec"><div class="sh"><h2>Languages</h2></div><div class="wrap">${MOCK.languages.map((l) => `<button class="chip" data-go="search/${l}">${l}</button>`).join("")}</div></section>`;
}
function pAlbums() {
  const li = MOCK.languages.indexOf(S.albumLang);
  const items = S.albumLang === "All" ? MOCK.albums : MOCK.albums.filter((_, i) => (i + li) % 3 !== 0);
  return `${head("Albums")}${chips(["All"].concat(MOCK.languages.slice(0, 8)), S.albumLang, "data-al")}<div style="height:14px"></div>${grid(items, "album")}`;
}
const pChart = () => `<div class="col">${head("Charts")}${MOCK.charts.map((c) => `<div class="row" data-go="playlist/${c.id}"><img src="${MOCK.img(c.img, 150)}" alt=""><div class="rt"><b>${esc(c.title)}</b><span>${c.subtitle}</span></div>${icon("back", 16).replace("m15 18-6-6 6-6", "m9 18 6-6-6-6")}</div>`).join("")}</div>`;
const pRadio = () => `${head("Radio")}<div class="tiles">${MOCK.radio.map((r, i) => `<div class="tile" style="background:${COLORS[i]}" ${playAttr(r, "Radio", ALBUM_ART)}>${r}${icon("radio", 28)}</div>`).join("")}</div>`;

function pAlbum(id) {
  const a = MOCK.albums.find((x) => x.id === id) || MOCK.albums[0];
  return `<div class="col">${detailHead(a.img, a.title, `${esc(a.subtitle)} - ${a.year} - ${MOCK.albumTracks.length} songs`, playBtn(MOCK.albumTracks[0][0], MOCK.albumTracks[0][1], a.img) + `<button class="btn">${icon("shuffle", 16)} Shuffle</button>` + like("album-" + id) + kebab)}${trackRows(MOCK.albumTracks, a.img)}</div>`;
}
function pPlaylist(id) {
  const p = MOCK.playlists.concat(MOCK.charts).find((x) => x.id === id) || MOCK.playlists[0];
  return `<div class="col">${detailHead(p.img, p.title, `${esc(p.subtitle)} - ${MOCK.newReleases.length} songs`, playBtn(MOCK.newReleases[0].title, MOCK.newReleases[0].subtitle, MOCK.newReleases[0].img) + like("pl-" + id) + kebab)}${relRows()}</div>`;
}
function pSong(id) {
  const f = MOCK.newReleases.find((x) => x.id === id);
  const s = Object.assign({}, MOCK.song, f ? { title: f.title, artist: f.subtitle, img: f.img, duration: f.duration } : {});
  return `<div class="col">${detailHead(s.img, s.title, `${esc(s.artist)} - ${s.year} - ${s.duration} - ${s.language} - ${s.plays} plays`, playBtn(s.title, s.artist, s.img) + like("song-" + s.title) + `<button class="btn" data-go="album/${s.albumId}">View album</button>` + kebab)}
  <section class="sec"><h2>Lyrics</h2><p class="bio" style="margin-top:8px">Lyrics are not available in this mockup. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p></section>
  ${shelf("More from Michael: Songs From The Motion Picture", "album/michael", MOCK.albumTracks.slice(0, 8).map((t) => `<a class="card" ${playAttr(t[0], t[1], ALBUM_ART)}><img src="${MOCK.img(ALBUM_ART, 150)}" alt=""><b>${esc(t[0])}</b><span>${esc(t[1])}</span></a>`).join(""))}</div>`;
}
function pShow(id) {
  const s = MOCK.shows.find((x) => x.id === id) || MOCK.shows[0];
  return `<div class="col">${detailHead(s.img, s.title, `${s.subtitle} - ${MOCK.episodes.length} episodes`, playBtn(MOCK.episodes[0][0], s.title, s.img) + `<button class="btn">Follow</button>` + kebab)}
  ${MOCK.episodes.map((e, i) => `<div class="row" data-go="episode/${i}"><span class="ix">${i + 1}</span><img src="${MOCK.img(s.img, 150)}" alt=""><div class="rt"><b>${esc(e[0])}</b><span>${e[1]}</span></div><span class="du">${e[2]}</span><button class="ib" ${playAttr(e[0], s.title, s.img)} aria-label="Play">${icon("play", 16)}</button>${kebab}</div>`).join("")}</div>`;
}
function pEpisode(id) {
  const e = MOCK.episodes[+id] || MOCK.episodes[0], s = MOCK.shows[0];
  return `<div class="col">${detailHead(s.img, e[0], `${s.title} - ${e[1]} - ${e[2]}`, playBtn(e[0], s.title, s.img) + like("ep-" + id) + kebab)}<p class="bio">Episode description placeholder. A devotional narration continuing the story across this season, with chapters drawn from the original scripture.</p></div>`;
}
function pArtist(id) {
  const a = MOCK.artists.find((x) => x.id === id) || MOCK.artists[0];
  const songs = MOCK.artistSongs.map((t, i) => row(i + 1, t[0], t[1], t[2], t[3])).join("");
  const tab = S.artistTab;
  const body = tab === "songs" ? songs : tab === "albums" ? grid(MOCK.albums.slice(0, 6), "album")
    : tab === "bio" ? `<p class="bio">${a.name} is one of the most listened to names in the catalog, with ${a.listeners} monthly listeners. Biography placeholder for the mockup: early life, breakthrough releases, collaborations and awards would appear here.</p>`
    : MOCK.artistSongs.slice(0, 3).map((t, i) => row(i + 1, t[0], t[1], t[2], t[3])).join("") + shelf("Albums", "", MOCK.albums.slice(0, 6).map((x) => card("album/" + x.id, x)).join(""));
  const tabs = [["overview", "Overview"], ["songs", "Songs"], ["albums", "Albums"], ["bio", "Biography"]];
  return `<div class="col">${detailHead(a.img, a.name, `${a.listeners} listeners`, playBtn(MOCK.artistSongs[0][0], a.name, a.img) + `<button class="btn">Follow</button>` + kebab, 1)}
  <div style="text-align:center;margin-bottom:12px"><div class="seg">${tabs.map((t) => `<button class="${tab === t[0] ? "on" : ""}" data-at="${t[0]}">${t[1]}</button>`).join("")}</div></div>${body}</div>`;
}

const searchBox = (v, focus) => `<div class="sbox" style="margin-top:0">${icon("search", 18)}<input type="text" data-search ${focus ? "autofocus" : ""} value="${esc(v || "")}" placeholder="Search songs, albums, artists" aria-label="Search"></div>`;
function pSearch(q) {
  if (!q) return `<div class="col">${searchBox("", 1)}<section><div class="sh"><h2>Recent searches</h2></div>${MOCK.recentSearches.map((r) => `<div class="row" data-go="search/${r}"><span class="muted">${icon("search", 16)}</span><div class="rt"><b>${r}</b></div></div>`).join("")}</section>
  <section class="sec"><div class="sh"><h2>Browse all</h2></div><div class="tiles">${BROWSE.map((b, i) => `<a class="tile" style="background:${COLORS[i]}" data-go="${b[0]}">${b[1]}${icon(b[2], 28)}</a>`).join("")}</div></section></div>`;
  const m = (t) => String(t).toLowerCase().includes(q.toLowerCase());
  let songs = MOCK.newReleases.filter((x) => m(x.title) || m(x.subtitle)), albums = MOCK.albums.filter((x) => m(x.title) || m(x.subtitle)),
    artists = MOCK.artists.filter((x) => m(x.name)), pls = MOCK.playlists.filter((x) => m(x.title));
  const none = !(songs.length + albums.length + artists.length + pls.length);
  if (none) { songs = MOCK.newReleases.slice(0, 4); albums = MOCK.albums.slice(0, 4); artists = MOCK.artists.slice(0, 4); pls = MOCK.playlists.slice(0, 4); }
  const top = albums[0] || artists[0] || pls[0] || songs[0];
  const topGo = top === albums[0] ? "album/" : top === artists[0] ? "artist/" : top === pls[0] ? "playlist/" : "song/";
  const f = S.sf, show = (k) => f === "all" || f === k;
  const tabs = [["all", "All"], ["songs", "Songs"], ["albums", "Albums"], ["artists", "Artists"], ["playlists", "Playlists"]];
  return `<div class="col">${searchBox(q)}<div class="chips">${tabs.map((t) => `<button class="chip ${f === t[0] ? "on" : ""}" data-sf="${t[0]}">${t[1]}</button>`).join("")}</div>
  ${none ? `<p class="muted sm" style="margin-top:10px">No exact matches for "${esc(q)}". Showing popular results.</p>` : ""}
  ${f === "all" ? `<section class="sec"><h2>Top result</h2><div class="row" style="height:72px;background:var(--card);margin-top:8px" data-go="${topGo}${top.id}"><img style="width:56px;height:56px" src="${MOCK.img(top.img, 150)}" alt=""><div class="rt"><b>${esc(top.title || top.name)}</b><span>${esc(top.subtitle || "Artist")}</span></div></div></section>` : ""}
  ${show("songs") ? `<section class="sec"><h2>Songs</h2>${songs.map((s, i) => row("", s.title, s.subtitle, s.duration, s.img)).join("")}</section>` : ""}
  ${show("albums") ? shelf("Albums", "", albums.map((x) => card("album/" + x.id, x)).join("")) : ""}
  ${show("artists") ? shelf("Artists", "", artists.map((x) => card("artist/" + x.id, x, 1)).join("")) : ""}
  ${show("playlists") ? shelf("Playlists", "", pls.map((x) => card("playlist/" + x.id, x)).join("")) : ""}</div>`;
}

const MTABS = [["playlists", "My Playlists"], ["recent", "Recently Played"], ["songs", "Liked Songs"], ["albums", "Liked Albums"], ["lplaylists", "Liked Playlists"], ["artists", "Liked Artists"], ["podcasts", "Liked Podcasts"]];
function pMe(tab) {
  tab = tab || "playlists";
  const body = { playlists: `<div class="row" data-go="me/playlist/road-trip"><img src="${MOCK.img(MOCK.playlists[3].img, 150)}" alt=""><div class="rt"><b>${esc(S.plName)}</b><span>4 songs</span></div>${kebab}</div><div style="margin-top:12px"><button class="btn">${icon("plus", 16)} New playlist</button></div>`,
    recent: relRows(), songs: trackRows(MOCK.albumTracks, ALBUM_ART), albums: grid(MOCK.albums.slice(0, 6), "album"), lplaylists: grid(MOCK.playlists.slice(0, 6), "playlist"),
    artists: grid(MOCK.artists.slice(0, 6), "artist", 1), podcasts: grid(MOCK.shows, "show") }[tab] || "";
  return `<div class="col"><div class="split" style="align-items:center;gap:14px;margin-bottom:16px"><div class="big-av" style="width:56px;height:56px;font-size:20px">${MOCK.user.name[0]}</div><div style="flex:1"><h1 style="font-size:22px">${MOCK.user.name}</h1><div class="muted sm">${MOCK.user.email}</div></div><div class="acts" style="margin:0"><button class="btn" data-go="settings">${icon("edit", 14)} Edit</button><button class="btn" data-go="login">${icon("logout", 14)} Logout</button></div></div>
  <div class="chips" style="margin-bottom:14px">${MTABS.map((t) => `<button class="chip ${tab === t[0] ? "on" : ""}" data-go="me/${t[0]}">${t[1]}</button>`).join("")}</div>${body}</div>`;
}
function pMyPlaylist() {
  const t = MOCK.newReleases.slice(0, 4);
  const ttl = S.renaming ? `<input type="text" id="rn" value="${esc(S.plName)}" style="width:200px;text-align:center">` : `<h1 style="margin:0">${esc(S.plName)}</h1>`;
  return `<div class="col">${detailHead(MOCK.playlists[3].img, "", "4 songs - by you", playBtn(t[0].title, t[0].subtitle, t[0].img) + `<button class="btn" data-rename>${icon("edit", 14)} ${S.renaming ? "Save" : "Rename"}</button><button class="btn bad" data-del>${icon("trash", 14)} Delete</button>`).replace("<h1></h1>", ttl)}${t.map((s, i) => row(i + 1, s.title, s.subtitle, s.duration, s.img)).join("")}</div>`;
}

const SNAV = [["Account", [["Edit Profile", "settings", "s-prof"], ["Change Password", "settings", "s-pw"], ["Delete Account", "settings", "s-del"]]],
  ["Appearance", [["Mode", "settings/appearance", "s-mode"], ["Themes", "settings/appearance", "s-theme"], ["Radius", "settings/appearance", "s-rad"]]],
  ["Preferences", [["Language", "settings/preferences", "s-lang"], ["Stream Quality", "settings/preferences", "s-q"], ["Download Quality", "settings/preferences", "s-q"], ["Image Quality", "settings/preferences", "s-q"]]]];
const fld = (l, h, type = "text", v = "", id = "") => `<div class="fld" ${id ? `id="${id}"` : ""}><label>${l}</label>${type === "password" ? `<div class="pw"><input type="${S.show ? "text" : "password"}" value="${v}"><button class="ib" data-eye aria-label="Show password">${icon("eye", 16)}</button></div>` : `<input type="${type}" value="${v}">`}<p>${h}</p></div>`;
const sel = (k, opts) => `<select data-sel="${k}">${opts.map((o) => `<option ${S[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select>`;
function pSettings(sub) {
  const nav = SNAV.map((g) => `<h4>${g[0]}</h4>` + g[1].map((i) => `<a data-go="${i[1]}" data-sc="${i[2]}" class="${("settings" + (sub ? "/" + sub : "")) === i[1] ? "on" : ""}">${i[0]}</a>`).join("")).join("");
  let body;
  if (sub === "appearance") body = `<h2>Appearance</h2><p class="muted sm">Customize the look of the app.</p>
   <div class="blk" style="border:0;margin:0;padding:0" id="s-mode"><h3>Theme Mode</h3><div class="wrap">${["Light", "Dark", "System"].map((m) => `<button class="btn w96 ${S.mode === m.toLowerCase() ? "sel" : ""}" data-mode="${m.toLowerCase()}">${m}</button>`).join("")}</div></div>
   <div class="blk" id="s-theme"><h3>Themes</h3><div class="wrap">${MOCK.themes.map((t) => `<button class="btn w96 ${S.theme === t[0] ? "sel" : ""}" data-theme="${t[0]}"><i class="dot" style="background:${t[1]}"></i>${t[0]}</button>`).join("")}</div></div>
   <div class="blk" id="s-rad"><h3>Radius</h3><div class="wrap">${MOCK.radii.map((r) => `<button class="btn w96 ${S.radius === r ? "sel" : ""}" data-radius="${r}">${r}</button>`).join("")}</div></div>`;
  else if (sub === "preferences") body = `<h2>Preferences</h2><p class="muted sm">Choose your languages and playback quality.</p>
   <div class="blk" style="border:0;margin:0;padding:0" id="s-lang"><h3>Languages</h3><div class="wrap">${MOCK.languages.map((l) => `<button class="chip ${S.langs.has(l) ? "on" : ""}" data-lang="${l}">${l}</button>`).join("")}</div><button class="btn pri" data-toast="Preferences saved">Save Preferences</button></div>
   <div class="blk" id="s-q"><h3>Quality Settings</h3>
    <div class="qr"><span class="muted">Stream Quality</span>${sel("stream", MOCK.qualities.stream)}</div>
    <div class="qr"><span class="muted">Download Quality</span>${sel("dl", MOCK.qualities.stream)}</div>
    <div class="qr"><span class="muted">Image Quality</span>${sel("img", MOCK.qualities.image)}</div></div>
   <div class="blk"><h3>Keyboard</h3><div class="qr" style="border:0"><span>Keyboard shortcuts</span><button class="sw ${S.kbd ? "on" : ""}" data-kbd aria-label="Keyboard shortcuts"></button></div><p class="muted sm">Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume.</p></div>`;
  else body = `<h2>Account Settings</h2><p class="muted sm">This is how others will see you on the site.</p>
   <div class="split"><div>${fld("Name", "This is the name that will be displayed on your profile.", "text", MOCK.user.name, "s-prof")}${fld("Email", "Your sign-in email address.", "email", MOCK.user.email)}
    <div id="s-pw">${fld("Current Password", "Enter your current password to change it.", "password", "secret123")}${fld("New Password", "Use at least 8 characters.", "password", "")}</div>
    <button class="btn pri" data-toast="Changes saved">Save Changes</button></div><div class="big-av">${MOCK.user.name[0]}</div></div>
   <div class="blk"><h3>Passkeys</h3><p class="muted sm" style="margin-bottom:10px">Sign in without a password using your device.</p><button class="btn">${icon("key", 14)} Add passkey</button></div>
   <div class="blk" id="s-del"><h3>Delete Account</h3><p class="muted sm" style="margin-bottom:10px">Permanently remove your account and all data. This cannot be undone.</p><button class="btn bad">Delete Account</button></div>`;
  return `<h1>Settings</h1><p class="muted">Manage your account, appearance, and preference settings.</p><div class="sets"><div class="snav">${nav}</div><div class="sp">${body}</div></div>`;
}

function pAuth(kind) {
  const su = kind === "signup";
  return `<div class="bd" data-back></div><form class="pn" data-auth><button type="button" class="ib x" data-back aria-label="Close">${icon("x")}</button>
  <h1>${su ? "Create an account" : "Welcome back"}</h1><p class="muted sm">${su ? "Sign up to save your music." : "Sign in to continue listening."}</p>
  <div class="fld"><label>Email</label><input type="email" value="" placeholder="you@example.com"></div>
  <div class="fld"><label>Password</label><input type="password" placeholder="Password"></div>
  ${su ? `<div class="fld"><label>Confirm password</label><input type="password" placeholder="Confirm password"></div>` : ""}
  <button class="btn pri" type="submit">${su ? "Sign Up" : "Login with Email"}</button>
  ${su ? "" : `<button class="btn" type="button" data-go="home">${icon("key", 14)} Sign in with passkey</button>`}
  <div class="two"><button class="btn" type="button" data-go="home">Google</button><button class="btn" type="button" data-go="home">GitHub</button></div>
  <p class="ln">${su ? `Have an account? <a data-go="login">Login</a>` : `<a data-go="signup">Create an account</a> - <a data-go="login">Forgot password?</a>`}</p></form>`;
}

function page(r) {
  const p = r.params;
  switch (r.name) {
    case "home": return pHome();
    case "browse": return pBrowse();
    case "albums": return pAlbums();
    case "playlists": return head("Playlists") + grid(MOCK.playlists, "playlist");
    case "artists": return head("Artists") + grid(MOCK.artists, "artist", 1);
    case "radio": return pRadio();
    case "shows": return head("Podcasts") + grid(MOCK.shows, "show");
    case "chart": return pChart();
    case "album": return pAlbum(p[0]);
    case "playlist": return pPlaylist(p[0]);
    case "song": return pSong(p[0]);
    case "show": return pShow(p[0]);
    case "episode": return pEpisode(p[0]);
    case "artist": return pArtist(p[0]);
    case "search": return pSearch(p.join("/"));
    case "me": return p[0] === "playlist" ? pMyPlaylist() : pMe(p[0]);
    case "settings": return pSettings(p[0]);
    default: return pHome();
  }
}

function render(r) {
  curRoute = r;
  const authed = r.name === "login" || r.name === "signup";
  const pr = authed ? lastRoute : r;
  if (!authed) lastRoute = r;
  const noBack = pr.name === "home";
  $("#app").innerHTML = (noBack ? "" : `<button class="btn ghost back" data-back style="padding-left:6px">${icon("back", 16)} Back</button>`) + page(pr);
  $("#auth").innerHTML = authed ? pAuth(r.name) : "";
  $("#auth").classList.toggle("open", authed);
  $("#hdr").innerHTML = `<div class="logo"><i>${icon("play", 12)}</i>infinitunes<a class="allv" href="../index.html">All variants</a></div><div class="hr">${pr.name === "home" ? "" : `<button class="ib" data-go="search" aria-label="Search">${icon("search")}</button>`}<button class="avatar" data-avatar aria-label="Account">${MOCK.user.name[0]}</button></div>`;
  const act = NAV.find((n) => n[3] === pr.name || (n[3] === "browse" && BROWSE_ACTIVE[pr.name] && pr.name !== "chart"));
  $("#dock").innerHTML = NAV.map((n) => `<a data-go="${n[0]}" class="${act === n ? "on" : ""}">${icon(n[2], 18)}<span>${n[1]}</span></a>`).join("");
  $("#menu").classList.remove("open");
  closeNP();
  if (pr.name === "search" && !pr.params.length) setTimeout(() => $("#app input[data-search]") && $("#app input[data-search]").focus(), 0);
  doScroll();
}
function doScroll() {
  if (!S.sc) return;
  const id = S.sc;
  setTimeout(() => { const e = document.getElementById(id); if (e) e.scrollIntoView({ behavior: "smooth", block: "start" }); S.sc = null; }, 30);
}
const rerender = () => { const y = scrollY; render(Router.current()); scrollTo(0, y); };

function applyTheme() {
  const h = document.documentElement, dark = S.mode === "dark" || (S.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  h.classList.toggle("dark", dark);
  let c = MOCK.themes.find((t) => t[0] === S.theme)[1];
  const neutral = ["zinc", "slate", "stone", "gray", "neutral"].includes(S.theme);
  h.style.setProperty("--primary", dark && neutral ? "#e4e4e7" : c);
  h.style.setProperty("--primary-fg", (dark && neutral) || S.theme === "yellow" ? "#18181b" : "#fff");
  h.style.setProperty("--radius", S.radius + "rem");
}

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 1600); }
const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
function updatePlayer() {
  $("#pArt").src = MOCK.img(P.img, 150);
  $("#pTitle").textContent = P.title;
  $("#pArtist").textContent = P.artist;
  $("#pBtn").innerHTML = icon(P.playing ? "pause" : "play", 18);
  $("#pFill").style.width = P.pct + "%";
  if ($("#np").classList.contains("open")) fillNP();
}
function fillNP() {
  $("#np").innerHTML = `<div class="top"><button class="ib" data-npx aria-label="Close">${icon("down", 22)}</button><span class="muted sm">Now Playing</span>${kebab}</div>
  <img src="${MOCK.img(P.img, 500)}" alt=""><div class="meta"><h1>${esc(P.title)}</h1><div class="muted">${esc(P.artist)}</div></div>
  <div class="bar"><i id="nFill" style="width:${P.pct}%"></i></div><div class="times"><span id="nCur">${fmt(P.pct * 2.4)}</span><span>4:00</span></div>
  <div class="ctl">${like("np-" + P.title)}<button class="ib" data-skip>${icon("prev", 22)}</button><button class="ib big" data-pp>${icon(P.playing ? "pause" : "play", 24)}</button><button class="ib" data-skip>${icon("next", 22)}</button><button class="ib" data-more>${icon("more")}</button></div>`;
}
function closeNP() { $("#np").classList.remove("open"); }
function setPlay(t, a, i) { Object.assign(P, { title: t, artist: a, img: i, playing: true, pct: 0 }); updatePlayer(); }
setInterval(() => {
  if (!P.playing) return;
  P.pct = P.pct >= 100 ? 0 : P.pct + 0.4;
  $("#pFill").style.width = P.pct + "%";
  const n = $("#nFill"); if (n) { n.style.width = P.pct + "%"; $("#nCur").textContent = fmt(P.pct * 2.4); }
}, 500);

function showMenu(el, items) {
  const m = $("#menu"), r = el.getBoundingClientRect();
  m.innerHTML = items.map((i) => (i[1] ? `<a data-go="${i[1]}">${i[0]}</a>` : `<button data-toast="${i[0]}">${i[0]}</button>`)).join("");
  m.classList.add("open");
  m.style.top = Math.min(r.bottom + 4, innerHeight - m.offsetHeight - 8) + "px";
  m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + "px";
  m.style.zIndex = 95;
}

document.addEventListener("click", (e) => {
  const t = e.target, c = (s) => t.closest(s);
  let el;
  if (!c(".menu") && !c("[data-more]") && !c("[data-avatar]")) $("#menu").classList.remove("open");
  if ((el = c("[data-sc]"))) { S.sc = el.dataset.sc; if (Router.current().path === el.dataset.go) doScroll(); }
  if ((el = c("[data-more]"))) { e.stopPropagation(); showMenu(el, [["Play next"], ["Add to playlist"], ["Go to album", "album/michael"], ["Share"]]); return; }
  if ((el = c("[data-avatar]"))) { showMenu(el, [["Library", "me"], ["Settings", "settings"], ["Logout", "login"]]); return; }
  if ((el = c("[data-toast]"))) { toast(el.dataset.toast); $("#menu").classList.remove("open"); return; }
  if (c("[data-like]")) { el = c("[data-like]"); S.liked[el.dataset.like] = !S.liked[el.dataset.like]; el.classList.toggle("on"); e.stopPropagation(); return; }
  if (c("[data-pp]")) { P.playing = !P.playing; updatePlayer(); e.stopPropagation(); return; }
  if (c("[data-skip]")) { const l = MOCK.newReleases, i = l.findIndex((x) => x.title === P.title); const n = l[(i + 1) % l.length]; setPlay(n.title, n.subtitle, n.img); return; }
  if ((el = c("[data-play]"))) { setPlay(el.dataset.t, el.dataset.a, el.dataset.i); document.querySelectorAll(".row.cur").forEach((r) => r.classList.remove("cur")); const r = c(".row"); if (r) r.classList.add("cur"); return; }
  if (c("[data-npx]")) return closeNP();
  if (c("[data-np]")) { fillNP(); $("#np").classList.add("open"); return; }
  if ((el = c("[data-hl]"))) { S.homeLang = el.dataset.hl; return rerender(); }
  if ((el = c("[data-al]"))) { S.albumLang = el.dataset.al; return rerender(); }
  if ((el = c("[data-at]"))) { S.artistTab = el.dataset.at; return rerender(); }
  if ((el = c("[data-sf]"))) { S.sf = el.dataset.sf; return rerender(); }
  if ((el = c("[data-mode]"))) { S.mode = el.dataset.mode; applyTheme(); return rerender(); }
  if ((el = c("[data-theme]"))) { S.theme = el.dataset.theme; applyTheme(); return rerender(); }
  if ((el = c("[data-radius]"))) { S.radius = el.dataset.radius; applyTheme(); return rerender(); }
  if ((el = c("[data-lang]"))) { const l = el.dataset.lang; S.langs.has(l) ? S.langs.delete(l) : S.langs.add(l); return rerender(); }
  if (c("[data-kbd]")) { S.kbd = !S.kbd; return rerender(); }
  if (c("[data-eye]")) { S.show = !S.show; return rerender(); }
  if (c("[data-rename]")) { if (S.renaming) { const v = $("#rn").value.trim(); if (v) S.plName = v; } S.renaming = !S.renaming; return rerender(); }
  if (c("[data-del]")) { toast("Playlist deleted"); Router.go("me"); }
});
document.addEventListener("change", (e) => { const k = e.target.dataset.sel; if (k) S[k] = e.target.value; });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("[data-search]") && e.target.value.trim()) Router.go("search/" + encodeURIComponent(e.target.value.trim()));
  if (e.key === "Escape") closeNP();
});
document.addEventListener("submit", (e) => { e.preventDefault(); if (e.target.matches("[data-auth]")) Router.go("home"); });

setPlay(MOCK.albumTracks[7][0], MOCK.albumTracks[7][1], ALBUM_ART);
P.playing = false;
updatePlayer();
applyTheme();
Router.start(render);
