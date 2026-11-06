# Mzansi Elecxions

South African election results in one place: every national election since 1994 and every local government election since 2000, with the 2026 local elections counted live from the IEC. Also: how the vote and turnout changed over time, and a timeline of major news (corruption, leadership fights, the economy, unrest).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Press `Ctrl K` (or `/`) anywhere to jump to an election, a page or a news event.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Overview: the latest parliament, the 30-year vote-share chart with news markers, turnout, the latest events |
| `/elections` | Every election with its headline, winner and turnout |
| `/elections/[year]` | Full results, seats, events before the vote, and (2009, 2014) province and municipality breakdowns |
| `/local` | Local elections hub: the live 2026 count, vote share 2000–2026, hung councils over time |
| `/local/[year]` | One local election: a map you can drill from country to province to council to ward, results, council control, provinces, and every council with its full party result and ward winners |
| `/trends` | Vote share, the swing table, seats over time, turnout |
| `/timeline` | News events grouped by the election that followed them, filterable by topic and party |
| `/live` | Live counting board and map for the current local election, updated every minute |

## Data

- **`src/data/openup.json`**: 2009 and 2014 results by country, province and municipality, extracted from the [OpenUpSA elections-api](https://github.com/OpenUpSA/elections-api) database. The hosted API (`iec-v2.code4sa.org`) is offline, but the repo still ships `data/elections.sqlite.gz`. To regenerate:

  ```bash
  python scripts/extract_openup.py elections.sqlite municipality.csv src/data/openup.json
  ```

  `municipality.csv` is `delims/municipality.csv` from the same repo.
- **`src/lib/elections.ts`**: national results for every year. 1994–2004, 2019 and 2024 are the IEC's official National Assembly results; 2009 and 2014 are computed from the OpenUp data.
- **`src/lib/events.ts`**: the news timeline. Add an event by appending to `EVENTS`. The vote shift shown after each event is worked out automatically from the next election.

The timeline shows timing, not cause. The site says so wherever an event sits next to a result.

## Local elections and live results

Local results come from the IEC's public results dashboard (`results.elections.org.za/dashboards/lge`), which publishes JSON for every level (national, province, municipality with wards) of every local election since 2000. It needs no API key. See `src/lib/lge-core.ts`.

- **Past elections (2000–2021)** are served from `src/data/lge-history.json`, a snapshot taken with:

  ```bash
  node scripts/fetch-lge.mts
  ```

- **The current election (2026)** is fetched from the IEC at request time and cached for 60 seconds, shared by every visitor (`src/lib/lge.ts`). Pages refresh every minute while counting. If the IEC feed is unreachable, the site falls back to the snapshot and says so.
- **Council detail** (every party and ward winner) is fetched on demand via `/api/lge/[year]/municipality/[id]`.

Once the IEC declares the final 2026 result, run `node scripts/fetch-lge.mts` again so the snapshot holds the final figures.

### Maps

Boundaries come from the same dashboard (`results.elections.org.za/ElectionMap/MapData/{year}/`), as GeoJSON for every council and, per council, every ward. They are converted to simplified TopoJSON (`src/lib/geo-core.ts`), which keeps neighbouring borders gap-free:

- **Council boundaries** for each year are prebuilt into `public/geo/councils-{year}.json` (120–420 KB each) with `node scripts/fetch-geo.mts`.
- **Ward boundaries** are fetched per council on demand through `/api/geo/[year]/wards/[id]` and cached permanently, since published boundaries don't change.

The map (`src/components/map/council-map.tsx`) is plain SVG drawn with d3-geo: councils are coloured by leading party, hung councils are hatched, councils still counting are drawn darker. Clicking zooms from country to province to council, where each ward is coloured by its winner and shows the winning candidate on hover. Esc zooms out.

`api.elections.org.za` (the IEC's official API) needs a username and password from webmaster@elections.org.za. It has the same results plus candidates and voter lookups, and could replace the dashboard feed once you have credentials. `vmdgisapi.elections.org.za` serves voting-station and boundary maps, not results.

## Stack

Next.js 16 (App Router, Cache Components), Tailwind CSS v4, Framer Motion, Phosphor icons, Geist. Charts are hand-built SVG. Party colours were checked for colour-blind separation, and each chart also labels parties directly.
