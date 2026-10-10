# A11y / PWA / OG / SEO audit summary (Sonnet, build 3bd38a8; evidence in this dir)

A1 SERIOUS contrast on artwork wash, LIGHT: album "8 Songs · 37:44" 1.74, "ALBUM" 1.93, 54/105 nodes fail @1440; artist "Verified" 1.73; toolbar Search over wash 3.0; home hero eyebrow 2.62, title 2.81; browse tiles white on #f97316 2.8, #16a34a 3.29; settings font swatches 3.7; footer 4.33. Dark mostly ok. Fix: stronger muted token on wash pages / cap wash lightness / plate behind header meta+rows; darken tiles.
A2 SERIOUS no <main> on (auth) pages + app/not-found.tsx; aria-hide ArtistSpotlight.
A3 SERIOUS search trigger aria-label mismatch (components/search/search-menu.tsx ~85/119).
A4 MOD focus: expanded player no aria-modal, focus escapes; languages popover not modal; user menu first focus on non-item, Tab escapes; queue no role, toast li focusable.
A5 MOD heading order (track-row h3 under h1, chart/radio card h3, me error h3). A6 MOD row buttons named "Play"/"Like" w/o title. A7 MINOR redundant alt (use alt=""), auth inputs no aria-describedby. A8 MINOR menu aria-required-children.
Forced colors: slider tracks vanish, active thumb black (glass.css ~790). Touch targets 32px at 390 (lib/control-styles.ts). Reflow: appearance swatch row.
PWA: installable; missing maskable icon (padded opaque), apple-icon transparent -> black; missing id/scope/description/shortcuts/screenshots; no service worker/offline.
OG: no canonical; search/me/settings/auth og:url = site root, generic titles, no image; twitter tags generic (lib/metadata.ts only sets openGraph). og route: artist 500 (octet-stream content-type rejected), label 400 (static.saavncdn.com/staticfe.saavn.com not in lib/image-hosts.ts) -> fall back to default card; entity cards 0.85-1.07MB (target 300KB); Cache-Control max-age=0 (add s-maxage/swr); pure Arabic title resets connection; route doesn't decode &amp;.
SEO: robots.txt only AI-bot blocks, no \* group / sitemap line; no sitemap; no noindex on auth/me/settings/search; no JSON-LD; soft 404s (radio bad token renders "x"); home title 82 chars, dev-speak default description.
Groups: G6 contrast (J, priority 1); G3 og route (M then J); G1 metadata plumbing/robots/sitemap (M, JSON-LD J); G2 noindex+titles (M); G4 soft 404s (J); G5 auth landmarks (M); G7 semantics (M); G8 overlays focus (J); G9 PWA manifest/icons (M, SW J); G10 forced colors/touch/reflow (M).
