# JioSaavn Radio Research & Provider Evidence

**Date:** 2026-10-02  
**Scope:** Official jiosaavn.com web assets, client sagas, provider endpoints, playback models, and Infinitunes integration.

---

## 1. Official Reference URLs & Published Assets

- **Browse Page:** `https://www.jiosaavn.com/radio`
- **Client Script (Webradio Sagas & API Calls):** `https://staticweb6.jiosaavn.com/web6/jioindw/dist/1790247351/_s/app-6efaf94a.7ad264442838eef3d4fe.js`
- **Client Script (Constants & Entity Types):** `https://staticweb6.jiosaavn.com/web6/jioindw/dist/1790247351/_s/app-7694909f.540a2757ac3df4c6bf52.js`
- **Client Script (Player Controls & Menus):** `https://staticweb6.jiosaavn.com/web6/jioindw/dist/1790247351/_s/app-8e95763e.b0ba7e994f91ae0ccd19.js`
- **Client Script (Browse Actions):** `https://staticweb6.jiosaavn.com/web6/jioindw/dist/1790247351/_s/Browse-components-container-Browse.6a211f60b232d69ba616.js`
- **Upstream API Endpoint:** `https://www.jiosaavn.com/api.php`

---

## 2. Source-Grounded Upstream API Findings

### 2.1 `webradio.getFeaturedStations`

- **Published Client Usage:** Module 98043 in `app-6efaf94a.7ad264442838eef3d4fe.js`.
- **Parameters:**
  - `_marker: 0`, `_format: "json"`, `api_version: 4`, `ctx: "web6dot0"`
  - Optional `language`: comma-separated language filter (e.g. `hindi,english`)
  - Optional paging params: `n`, `p`
- **Observed Response:** Array of `Radio` items:
  ```json
  [
    {
      "id": "Bollywood Classics 30s-40s",
      "title": "Bollywood Classics 30s-40s",
      "subtitle": "Hindi Radio",
      "type": "radio_station",
      "image": "https://c.saavncdn.com/...",
      "perma_url": "https://www.saavn.com/s/radio/hindi-featured-station/Bollywood-Classics-30s-40s",
      "more_info": {
        "featured_station_type": "featured",
        "query": "",
        "color": "#3f6974",
        "language": "hindi",
        "station_display_text": "Bollywood Classics 30s-40s"
      }
    }
  ]
  ```

### 2.2 `webradio.createFeaturedStation`

- **Published Client Usage:**
  ```javascript
  if ("featured" == e.type) t.params.__call = "webradio.createFeaturedStation";
  ```
- **Parameters:**
  - `name`: Station title / display text (e.g., `"Bollywood Classics 30s-40s"`, `"Jai Hanuman"`).
  - `language`: Target language (e.g., `"hindi"`).
  - `query`: Optional query string.
- **Observed Response:**
  ```json
  { "stationid": "ZXqMranC8KE89N61WNxq4ixIgC8KEtmFYoRNr7fJhUpJoCF72GYTBg__" }
  ```
- **Behavior Note:** Name must match the real station display name; kebab-slug tokens with hyphens may yield empty stations.

### 2.3 `webradio.createArtistStation`

- **Published Client Usage:**
  ```javascript
  if ("artist" == e.type) {
    t.params.__call = "webradio.createArtistStation";
    t.params.query = e.query;
  }
  ```
- **Parameters:**
  - `artistid`: Upstream artist identifier (e.g., `"459320"` for Arijit Singh).
  - `name`: Artist name (`"Arijit Singh"`).
  - `query`: Artist query string.
  - `language`: Preferred language string.
  - `mode`: `""`.
- **Observed Response:**
  ```json
  {
    "stationid": "dAGkp1jyiYNB1CPcjOe-0ZGLQCNQdFwe3X4oYJYo5LSGnPjj31yeDw__~^~artist_radio~^~459320"
  }
  ```

### 2.4 `webradio.getSong`

- **Published Client Usage:** Function `p(e)` and saga `E(e)` in `app-6efaf94a.7ad264442838eef3d4fe.js`.
- **Parameters:**
  - `stationid`: Created station session ID string.
  - `k`: Number of songs requested (e.g., 10 or 20).
  - `next`: `1` for subsequent rolling batches; omitted for initial fetch.
- **Observed Response Structure:**
  Object keyed by string integers (`"0"`, `"1"`, ...), plus `"stationid"`:
  ```json
  {
    "0": {
      "song": {
        "id": "f6KjdNTv",
        "title": "Super Fast Hanuman Chalisa",
        "subtitle": "...",
        "more_info": {
          "encrypted_media_url": "..."
        }
      }
    },
    "1": { "song": { ... } },
    "stationid": "..."
  }
  ```
  Each song payload contains `encrypted_media_url`, which Infinitunes decrypts via `withDownloadUrl`.

### 2.5 `webradio.createStation` / `webradio.createEntityStation` (Unverifiable / Deprecated in Web Client)

- **Empirical Observation:** Live HTTP requests with song IDs, album IDs, and playlist IDs return `[]` from the unauthenticated public API gateway.
- **Client Fallback Semantics:** In the JioSaavn web client, starting radio on a song seeds either the primary artist's station or a language/genre radio station.

---

## 3. Playback, Queue Refill & Client State Semantics

1. **Transient Session State:**
   Station creation (`createFeaturedStation` / `createArtistStation`) is completely transient; no user account or database writes are performed.
2. **Queue Initialization:**
   Starting a station fetches the initial batch (e.g., 20 songs), converts them to player `Queue` items via `toQueue()`, sets `queue`, initializes playback at index 0, and stores the active radio station descriptor (`stationId`, `name`, `type`).
3. **Continuous Queue Refill:**
   When playing in radio mode, as playback approaches the end of the queue (remaining items $\le 3$), the player issues a background request for the next batch using `webradio.getSong` with `next=1` and appends the new tracks to the queue.
4. **Playback Controls:**
   - Previous / Next work within the populated queue.
   - Shuffle & Repeat remain available or can be toggled without losing radio queue continuity.
   - Tile & Header "Play Radio" buttons launch the artist or song radio stream.
