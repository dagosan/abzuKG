# RINF module

Everything under `src/rinf/` was added for ERA's RINF frontend and is not part
of upstream Abzu. It reads RINF data straight from ERA's SPARQL endpoint and
draws it on Abzu's modern (MapLibre) map. It is read-only.

## Data source

- Endpoint: `https://graph.data.era.europa.eu/repositories/rinf-plus`
  (GraphDB; the one rinf.data.era.europa.eu itself uses). Override it with
  `rinfSparqlEndpoint` in `bootstrap.json`. The page at
  `rinf.data.era.europa.eu/endpoint` is a web UI, not the query service.
- The endpoint allows cross-origin GET and POST, so no proxy is needed.
- Only current-model OPs are used (`http://data.europa.eu/949/operationalPoint/…`).
  Older model generations in the same repository
  (`…/functionalInfrastructure/operationalPoints/…`, `…/OperationalPoint_…`)
  are ignored for now.
- An OP's position is on its `era:netReference` (`wgs84 lat/long`). There is
  one net reference per line the OP sits on, all at the same position, so the
  query groups them into one point per OP.
- OPs are versioned by `era:validity`. The map shows the version valid today;
  an OP without a validity period counts as always valid.
- Border points are declared by each neighbouring IM, so they can show as two
  overlapping points.

## Structure

| Folder | What it does |
| --- | --- |
| `config/` | Endpoint from `bootstrap.json`, with ERA's public one as default |
| `api/` | SPARQL client and query builders |
| `models/` | Mapping from SPARQL rows to typed objects |
| `state/` | Redux slice (`state.rinf`) and the remembered layer toggle |
| `map/` | MapLibre layers, popups and their hooks |

## Hooks into upstream files

Kept to one or two lines each, so upstream releases merge easily:

- `src/components/modern/Map/ModernEditStopMap.tsx` — renders `<RinfOperationalPointsLayer />`
- `src/components/modern/Map/controls/MapSettingsPanel.tsx` — "Show RINF operational points" toggle
- `src/reducers/index.ts` — registers the `rinf` reducer
- `src/config/ConfigContext.ts` — `rinfSparqlEndpoint` config field
- `src/static/lang/en.json`, `nb.json` — `rinf_*` text keys (`nb.json` holds
  English placeholders, to keep upstream's rule that both files carry every key)

## Licence and notices

Distributed under the same licence as Abzu (EUPL 1.2). Each file here starts
with the EUPL notice used upstream, followed by a line saying it was added for
the ERA RINF frontend and when. Upstream files we touch carry a line in their
header: `Modified for the ERA RINF frontend, <date>: <what changed>`. The JSON
language files cannot hold comments; their RINF keys all start with `rinf_`.
