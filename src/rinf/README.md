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
  place search (unchanged). RINF mode searches, on Enter (~3 s), both:
  - OPs by name (contains), UOPID or primary location code (starts with);
  - sections of line by national line number (starts with), canonical id or
    name (contains; the label's "Section of Line …" / "(from … until …)"
    boilerplate is ignored).

  OPs are listed first, then sections of line, each group ranked exact
  matches first. Picking a result opens its panel. The choice of mode is
  remembered; RINF is the default.

- **RINF reports** (a tab next to Map and Reports, route `/rinf-reports`),
  laid out like Abzu's Reports: the search on the left, results in a table.
  Pick a parameter by RINF number or name, a condition (offered by the kind
  of value: codes in use with their counts, numbers with their unit, yes/no,
  text, or "not applicable" / "not yet available"), and optionally countries
  and/or IMs. The table lists every section of line and OP holding a matching
  element — the section or OP itself, a running track or siding of it, an
  object linked from the section or OP (e.g. its primary location, for the
  primary location code), or an object linked from a track (contact line
  system, ETCS, train detection, tunnel, platform edge) — with name, type, ID, line, country, IM
  and the matching elements; columns can be hidden, results come 50 a page,
  and "Export to CSV" saves all of them. A row opens its details beside the
  map, with a way back to the report. "Show on map" draws every result on
  the map at any zoom, fades the rest and zooms to fit; a chip on the map
  leads back to the report or hides the results. The search lives in the
  page address, so it can be bookmarked or shared (old `/parameter-search`
  links redirect). At most 5,000 places are listed.

- **Location codes** (a tab next to RINF reports, route `/location-codes`):
  the code allocation workflow of the Agency's _Procedure for the assignment
  of location codes_ (v1.0) and TD 103 v4.0, for primary (PLC) and
  subsidiary (SLC) location codes: new codes, first population with
  existing codes, amendments and deactivations. See "Location code
  workflow" below.

## Running it locally

The app reads its settings from `public/bootstrap.json`, which git ignores
on purpose (upstream rule). After a fresh clone, copy the RINF example:

```
cp public/bootstrap.rinf.example.json public/bootstrap.json
npm install
npm start
```

Without that file the page stays blank.

To run it on a server or NAS in Docker, see `deploy/README.md`.

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
- Parameter search first asks which element types carry the parameter and
  how each reaches a section of line or OP (sampled), then searches only
  along those links: following every possible link is 10–30× slower. IM
  limits use the named graph each IM publishes in (`…/949/graph/<code>`); a
  country limit picks the IMs active there and then checks each result's
  `era:inCountry`. IM names are not in the data, so IMs are shown by code.

## Location code workflow

Everything under `locationCodes/`. It follows the procedure step by step:

| Step                        | Who                                                                            | In the app                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Pre-submission check      | Requester                                                                      | Confirmation box on the form, with what to check for a PLC or an SLC                                                                                         |
| 2 Submission, admissibility | Requester                                                                      | The form; mandatory elements, Art. 3(9) category and language are checked before it can be sent                                                              |
| 3 Registration              | Code administrator                                                             | "Register request" gives the reference (LC-2026-0001) and starts T0; "Request information" stops the clock until the requester replies                       |
| 4 Technical validation      | Code administrator                                                             | "Run checks" asks the ERA Knowledge Graph and this register (Annex A); manual lines are confirmed one by one; "Complete validation" records a recommendation |
| 5 RINF harmonisation        | RINF correspondent                                                             | Confirms or corrects the OP / section of line, or records "not on the network". PLCs only: an SLC inherits its parent's position                             |
| 6 Decision                  | Validating officer (+ external coordination point for non-EU or legacy ranges) | Assign or reject with an Annex B ground and the provision relied upon                                                                                        |
| 7 Recording and publication | Code administrator                                                             | Writes the code to the register                                                                                                                              |
| 8 Notification and closure  | Code administrator                                                             | Closes the file; the requester can ask for a review within 20 working days (section 14)                                                                      |

Rules enforced:

- **Four eyes** (procedure Table 3): the validating officer of a request
  may not have acted on it as code administrator, and the other way round;
  a review is decided by someone other than the original decider.
- **Codes are never reused**: a value counts as taken if it is in the KG, in
  the register (also when closed) or reserved by another open request.
- **Value assigned**: the proposed one if free, otherwise the _lowest_ free
  number in the country (not highest + 1: FI, CH and HR already use 99999).
  It is checked against the KG again at the moment of assignment.
- **PLC**: the RINF element must exist and have no PLC yet (KG or register);
  no other open request for the same element.
- **SLC**: an active parent PLC (KG or register); type code from TD 103,
  Table 6 (full list, not only the procedure's extract). Where the requester
  is not the party Table 6 names, the check asks to consult that party —
  never a rejection (procedure 6.7).
- **Closing a PLC** with active SLCs (register or KG) is refused unless the
  request closes them in the same operation.
- **Deadlines** (section 11, still "proposed"): working days from T0,
  Monday to Friday, minus the time a request for information ran. Agency
  holidays go in `AGENCY_HOLIDAYS` (`workflow/workingDays.ts`), empty for now.

Known limits of this first version:

- **Storage is the browser** (`store/browserStore.ts`, local storage). Each
  browser has its own requests; the ⋮ menu downloads and restores a JSON
  backup. `store/LocationCodeStore.ts` is the contract a CAS or Tiamat
  backend implements to replace it (`store/activeStore.ts`).
- **Roles are picked by hand** (the "Acting as" switch and a name), not
  taken from the login. A requester sees only the requests they submitted.
- **Publication** writes to this register only, not to the Knowledge Graph.
- **Retail and virtual codes** are not handled yet; the retail doublet check
  for a PLC is a manual line.
- **Code format**: the KG writes PLCs as ISO alpha-2 + five digits
  (`BE00438`), so the app does too. TD 103 4.10.1 and the procedure (Table 5) describe a two-digit _numeric_ country code (code list B.9.1).
- SLC values the Agency assigns are numeric, zero-padded to ten characters
  (TSI LocationSubsidiaryCode is up to ten characters); the SLCs in the KG
  today are Bane NOR's (`NO-S.998`) and carry no type code.
- Bulk first-population requests (one request, many codes) are not handled:
  one request is one code.

| Folder (under `locationCodes/`)               | What it does                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `model/`                                      | Request, register entry, code types, TD 103 Table 6, Art. 3(9) categories, Annex A and B, code format                 |
| `workflow/`                                   | Who may take which step (`availableActions`), the steps themselves (`applyAction`), four eyes, deadlines, publication |
| `checks/`                                     | Admissibility, the KG queries, and the technical checks                                                               |
| `store/`                                      | The storage contract and the browser implementation                                                                   |
| `state/`                                      | Redux slice `state.rinf.locationCodes` and the thunks                                                                 |
| `page/`, `form/`, `requestFile/`, `register/` | The screens                                                                                                           |

The OP details panel has a "Request a location code" button that opens the
form positioned on that OP.

**The RINF element comes first.** The Location box opens with the RINF
element: a search bar (name, UOPID or line number, on Enter) with a "Pick
from a map" button beside it. Choosing the element fills the rest of the
form from RINF (`form/rinfAutofill.ts`, one query of ~0.6 s), each field
marked "From RINF" until edited:

- new PLC: name, country (from `era:inCountry`, else the UOPID), IM (the
  dataset declaring it, `…/graph/<code>`). An OP or section of line may
  hold any number of PLCs (1,595 OPs in RINF have several, Lyon-Part-Dieu
  three), so codes already on it are listed with their names as
  information, never as a reason to refuse;
- existing code (first population): also the PLC RINF holds;
- amendment or deactivation: the PLC concerned; with several, the user
  picks it from the notice;
- SLC: the parent PLC (picked from the notice when the element has several) (the element's, or for an asset its OP's or section's),
  and for an asset its name and type (running track 01, switch 10, platform
  edge 15, tunnel 24, signal 27; a siding may be 06 or 07, so it is left to
  the requester);
- a border point declared by two IMs (e.g. EU00010: 0087 FR01092 and 0080
  DE18314): only the name, with a notice listing the declarations.

**Picking from a map.** "Pick from a map" keeps the
form (`formDraft` in the slice) and opens the map with a banner. Clicking an
OP or section of line (or finding it with the header search) opens its panel
with "Use this operational point / section of line". For an SLC, each
running track, siding, platform edge and tunnel in the panel also has
"Use this" (`picking/UseAssetButton.tsx`; classes in `model/rinfLink.ts`):
assets are stored by their `era:canonicalURI` with the OP or section of
line they belong to. The form comes back at `/location-codes/new?resume=1`.
For an SLC the map opens on the OP its parent PLC is on.

- A PLC is positioned on an OP or section of line only (Art. 9(6), procedure
  8.6); an asset is refused for a PLC.
- An SLC may be positioned on an OP, section of line or asset; it then goes
  through RINF harmonisation (step 5) like a PLC, and a check warns when
  the element does not carry the parent PLC. Without one it inherits the
  parent's position.
- Signals and switches are in the asset list but are rarely linked to an OP
  or section of line in the KG (976 of 8,441 signals, 135 of 17,853
  switches), so they seldom appear in a panel.

## Structure

| Folder             | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `config/`          | Endpoint from `bootstrap.json`, with ERA's public one as default   |
| `api/`             | SPARQL client and query builders                                   |
| `models/`          | Mapping from SPARQL rows to typed objects                          |
| `state/`           | Redux state (`state.rinf`): one slice per concern, and the toggles |
| `map/`             | MapLibre layers, click handling, loading bar                       |
| `panel/`           | The details panel, shared by OPs and SoLs                          |
| `pages/`           | Route element for `/<kind>/:canonicalId`, and moving the map there |
| `search/`          | The header search switch and the RINF search box                   |
| `parameterSearch/` | The report's search form and the hooks that run it                 |
| `reports/`         | The RINF reports page: table, columns, paging, CSV, the tab        |
| `locationCodes/`   | The location code allocation workflow (see above)                  |

`detailsKinds.ts` describes each kind (route, id prefix, labels, hidden
statements); adding a kind there adds its route and panel.

## Hooks into upstream files

Kept to one or two lines each, so upstream releases merge easily:

- `src/components/modern/Map/ModernEditStopMap.tsx` — renders `<RinfMapLayers />`
- `src/components/modern/Map/controls/MapSettingsPanel.tsx` — spreads `useRinfLayerSettingItems()` into its toggles
- `src/containers/modern/App.tsx` — `{rinfRoutes(path)}` inside its `<Routes>`
- `src/components/modern/Header/ModernHeader.tsx` — wraps `<HeaderSearch />` in
  `<RinfHeaderSearch stopPlaceSearch={…} />`
- `src/components/modern/Header/components/NavigationLine.tsx` — the
  `<RinfReportsTab />` and `<LocationCodesTab />` tabs, and choosing them
- `src/components/modern/Header/hooks/useLastMapLocation.ts` — the RINF
  reports and location code pages are not map locations (like Reports);
  `fullPagePaths.ts` lists them
- `src/containers/modern/App.tsx` — also hides the map on the RINF reports
  and location code pages, as it does on Reports, and hides the map's
  controls with it

Upstream fixes (also useful to Abzu itself; candidates to offer upstream).
Abzu sizes pages from a 104 px header (64 + 40), but it rendered at 119 px,
so its Reports page ran 15 px past the window, and MapLibre's attribution
showed through the hidden map over the Reports footer:

- `src/components/modern/styles.ts` — logo button padding fits 64 px
- `src/components/modern/Header/components/navigationPillSx.ts` — no extra
  vertical tab padding, so the strip stays 40 px
- `src/components/modern/Header/components/NavigationLine.tsx` — separator as
  an inset shadow, not a 1 px border
- `src/containers/modern/App.tsx` — map controls hidden with the map
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
