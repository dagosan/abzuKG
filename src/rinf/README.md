# RINF module

Everything under `src/rinf/` was added for ERA's RINF frontend and is not part
of upstream Abzu. It reads RINF data straight from ERA's SPARQL endpoint and
draws it on Abzu's modern (MapLibre) map. It is read-only.

## What it does

- **Map layers** (zoom 8 and closer, loaded for the visible area): operational
  points as circles, sections of line as lines. Each can be switched off in
  Map preferences; the choice is remembered.
- **Details panel**: click an OP or a SoL, or open its link
  (`/operational-point/BELGB`, `/section-of-line/1440_BELGB_BECAD`), for every
  parameter of the element, its parts (tracks, sidings) and the objects each
  part links to (platform edges, contact line system, ETCS, train detection,
  tunnels, load capability, …). Parameters are named and ordered by RINF index
  from the ERA vocabulary, with units; "not applicable" and "not yet
  available" are shown as such. A filter narrows the list by name, RINF index
  or value. For an OP this includes its type, its primary location code
  (shown as code · name, e.g. "DE18314 · Perl Grenze") and its railway
  locations (km on each line). Opening a panel moves the map to the element
  when it is out of sight or the map is zoomed out too far to draw it.
- **Search**: a switch in the header chooses between RINF and Abzu's own stop
  place search (unchanged). RINF mode searches OPs by name (contains), UOPID
  or primary location code (starts with); press Enter to search, as a search
  takes about 2 s. Picking a result opens its panel. The choice of mode is
  remembered; RINF is the default.

## Data source

- Endpoint: `https://graph.data.era.europa.eu/repositories/rinf-plus`
  (GraphDB; the one rinf.data.era.europa.eu itself uses). Override it with
  `rinfSparqlEndpoint` in `bootstrap.json`. The page at
  `rinf.data.era.europa.eu/endpoint` is a web UI, not the query service.
- The endpoint allows cross-origin GET and POST, so no proxy is needed.
- Only current-model resources are used (`http://data.europa.eu/949/operationalPoint/…`,
  `…/sectionOfLine/…`). Older model generations in the same repository are ignored.
- Everything is versioned by `era:validity`; the map and panel show the
  version valid today. A resource without a validity period counts as always
  valid. 246 of 50,032 SoLs (2026-10-28) have no version valid today and so
  do not appear, e.g. line 161 Ernage – Gembloux, whose only version ended
  2026-09-06.
- OP position: on its `era:netReference` (`wgs84 lat/long`), one per line it
  sits on, all equal, so the query groups them.
- SoL shape: `era:netReference/geo:hasGeometry` (WKT). 97% are a straight line
  from start OP to end OP. SoLs in view are found with GeoSPARQL
  `geof:sfIntersects`, so a long SoL crossing the view is found too.
- Labels, RINF indices and units come from the ERA vocabulary in the same
  repository, fetched once per session (~900 terms, ~1 s).
- The IM appears as the vocabulary gives it ("IM role of the body with an
  organisation code 0088"); the organisation's name is not in this repository.
- Border points are declared by each neighbouring IM, so they can show as two
  overlapping points, and their panel shows one block per declaration,
  headed with the IM code of the dataset (named graph) it comes from.
- The id in a panel link is the element's canonical id (`era:canonicalURI`).
  For OPs it is usually, but not always, the UOPID (771 exceptions on
  2026-10-28).
- A primary location's label is its code for only 27% of them; the code
  (`era:primaryLocationCode`) is therefore fetched separately.
- The endpoint has no full-text index (no Lucene or Elasticsearch connector,
  no `onto:fts`), so search scans names: the query first finds matching OPs,
  then looks up only those, which takes ~2 s instead of 5–7 s. Very short,
  common text ("de") still takes ~6 s, hence the 2-character minimum.

## Structure

| Folder    | What it does                                                       |
| --------- | ------------------------------------------------------------------ |
| `config/` | Endpoint from `bootstrap.json`, with ERA's public one as default   |
| `api/`    | SPARQL client and query builders                                   |
| `models/` | Mapping from SPARQL rows to typed objects                          |
| `state/`  | Redux state (`state.rinf`): one slice per concern, and the toggles |
| `map/`    | MapLibre layers, click handling, loading bar                       |
| `panel/`  | The details panel, shared by OPs and SoLs                          |
| `pages/`  | Route element for `/<kind>/:canonicalId`, and moving the map there |
| `search/` | The header search switch and the RINF search box                   |

`detailsKinds.ts` describes each kind (route, id prefix, labels, hidden
statements); adding a kind there adds its route and panel.

## Hooks into upstream files

Kept to one or two lines each, so upstream releases merge easily:

- `src/components/modern/Map/ModernEditStopMap.tsx` — renders `<RinfMapLayers />`
- `src/components/modern/Map/controls/MapSettingsPanel.tsx` — spreads `useRinfLayerSettingItems()` into its toggles
- `src/containers/modern/App.tsx` — `{rinfRoutes(path)}` inside its `<Routes>`
- `src/components/modern/Header/ModernHeader.tsx` — wraps `<HeaderSearch />` in
  `<RinfHeaderSearch stopPlaceSearch={…} />`
- `src/reducers/index.ts` — registers `rinfReducer` as `rinf`
- `src/config/ConfigContext.ts` — `rinfSparqlEndpoint` config field
- `src/static/lang/en.json`, `nb.json` — `rinf_*` text keys (`nb.json` holds
  English placeholders, to keep upstream's rule that both files carry every key)

## Licence and notices

Distributed under the same licence as Abzu (EUPL 1.2). Each file here starts
with the EUPL notice used upstream, followed by a line saying it was added for
the ERA RINF frontend and when. Upstream files we touch carry a line in their
header: `Modified for the ERA RINF frontend, <date>: <what changed>`. The JSON
language files cannot hold comments; their RINF keys all start with `rinf_`.
