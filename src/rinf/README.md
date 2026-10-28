# RINF module

Everything under `src/rinf/` was added for ERA's RINF frontend and is not part
of upstream Abzu. It reads RINF data straight from ERA's SPARQL endpoint and
draws it on Abzu's modern (MapLibre) map. It is read-only.

## What it does

- **Map layers** (zoom 8 and closer, loaded for the visible area): operational
  points as circles, sections of line as lines. Each can be switched off in
  Map preferences; the choice is remembered.
- **OP popup**: click an OP for name, UOPID, type and country.
- **Section of line panel**: click a SoL, or open `/section-of-line/<canonical id>`
  (e.g. `/section-of-line/1440_BELGB_BECAD`), for every parameter of the SoL,
  its tracks, and the objects each track links to (contact line system, ETCS,
  train detection, tunnels, load capability, …). Parameters are named and
  ordered by RINF index from the ERA vocabulary, with units; "not applicable"
  and "not yet available" are shown as such. A filter narrows the list by
  name, RINF index or value.

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
  overlapping points.

## Structure

| Folder    | What it does                                                       |
| --------- | ------------------------------------------------------------------ |
| `config/` | Endpoint from `bootstrap.json`, with ERA's public one as default   |
| `api/`    | SPARQL client and query builders                                   |
| `models/` | Mapping from SPARQL rows to typed objects                          |
| `state/`  | Redux state (`state.rinf`): one slice per concern, and the toggles |
| `map/`    | MapLibre layers, popup, click handling, loading bar                |
| `panel/`  | The section of line panel                                          |
| `pages/`  | Route element for `/section-of-line/:canonicalId`                  |

## Hooks into upstream files

Kept to one or two lines each, so upstream releases merge easily:

- `src/components/modern/Map/ModernEditStopMap.tsx` — renders `<RinfMapLayers />`
- `src/components/modern/Map/controls/MapSettingsPanel.tsx` — spreads `useRinfLayerSettingItems()` into its toggles
- `src/containers/modern/App.tsx` — the `/section-of-line/:canonicalId` route
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
