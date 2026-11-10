# RINF module

Everything under `src/rinf/` was added for ERA's Location Code Manager and is not part
of upstream Abzu. It reads RINF data straight from ERA's SPARQL endpoint and
draws it on Abzu's modern (MapLibre) map; the RINF data itself is read-only.

## What it does

- **Map layers** (zoom 8 and closer, loaded for the visible area): operational
  points as circles, sections of line as lines. Each can be switched off in
  Map preferences; the choice is remembered. Further out, a hint at the bottom
  of the map says to zoom in. The deployed `bootstrap.json` opens the map at
  zoom 8 (a position saved in Initial map settings still takes precedence).
- **Location codes on the map** (zoom 11 and closer, on by default, own switch
  in Map preferences): a label under each OP, and on the middle of each SoL,
  with its codes. They come from two places, told apart by style, with a
  legend at the bottom of the map:
  - outlined dark: in RINF only (the PLC the OP/SoL carries in the KG, read
    with the map layers at no extra cost);
  - filled blue: in the register and in RINF (the same code on the same element);
  - dashed blue: in the register only, not (yet) in RINF.

  Register codes are placed on their linked element (an asset's code on its
  OP/SoL); an SLC without a link goes with its parent PLC, a PLC without a link
  on the elements that carry it in RINF. Closed codes are left out. The
  register is loaded when the labels are on; if it can't be reached the legend
  says so and only RINF's codes show. SLCs in the KG (Bane NOR) are not read,
  so register SLCs always show as "register only". Clicking a label opens the
  element's panel. Above 400 labels in view (a dense node) none are drawn until
  you zoom in further.

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

## Look and feel (ERA theme)

The ERA look is a theme file, not code: `public/theme/era-theme.json`, picked
by `"themeConfigs": ["theme/era-theme.json"]` in `bootstrap.json` (see
`THEME_CONFIG_GUIDE.md`). A copy of `bootstrap.json` made before 2026-10-30
lacks that line and keeps MUI's default blue look; add it.

Values are taken from the ERA website (era.europa.eu, which uses the
OpenEuropa Bootstrap theme), checked 2026-10-30:

| Token                  | Value                             | ERA source / use here                              |
| ---------------------- | --------------------------------- | -------------------------------------------------- |
| primary                | `#004494`                         | ERA blue (logo, navigation bar); header, SoL lines |
| primary.dark           | `#003A7E`                         | ERA button hover                                   |
| secondary              | `#323334`                         | ERA "dark"; operational point dots                 |
| warning                | `#FFED00`                         | EU yellow; focus ring on the map, unsaved markers  |
| info / success / error | `#5DA9DD` / `#09854C` / `#A51F2C` | ERA Bootstrap colours                              |
| text, divider          | `#212529`, `#495057`, `#DEE2E6`   | ERA body text, muted text, borders                 |
| background             | `#F5F5F5` / `#FFFFFF`             | ERA light grey band / cards                        |
| font                   | system font stack                 | same stack as the ERA site; no font files to host  |
| radius                 | 6 px                              | ERA 0.375 rem                                      |

The selected navigation tab is white with blue text, like the active item in
the ERA site's menu; disabled primary buttons fade to 45 % (Bootstrap's way),
so they stay visible on the blue report footers.

Assets: `public/era-logo.png` is the ERA logo from the website on a white
rounded plate (the logo itself is unchanged; the plate keeps it on white as on
era.europa.eu, since the header is blue), `public/era-favicon.ico` is the
website's favicon. **These two files are ERA's logo and emblem, not EUPL
code**: they may not be reused outside ERA products, and must be left out if
this fork is offered upstream.

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
- **Register data model = CRD's location table (since 2026-11-02).** One
  row per _version_ of a code (`model/CodeVersion.ts`), with CRD's 22
  columns in camelCase (`Country_ISO_code` → `countryIsoCode`, …,
  `Mod_Date` → `modDate`; `Active_Flag` is worked out from the dates), plus
  what the workflow needs: version number, SLC fields, RINF element, and
  the request that opened and the one that ended the version. A new code
  gets version 1, valid from publication. An amendment ends the current
  version the day before its effective date and opens the next one, so a
  change of name, IM or use is a new version as in CRD; a deactivation ends
  it (`End_Validity` is the last valid day, as in CRD). A change must take
  effect after the current version starts. Passenger and freight use dates
  follow from the flags: a use starts with the version that switches it on
  and ends with a closure. A PLC request gives the CRD columns on the form
  (section "Location data (CRD)"): the four flags (required for a new
  code), position (filled in from RINF: an OP's coordinates, a section of
  line's midpoint), NUTS code, free text, and the ASCII name (made from
  the name when left blank). The register page lists every version and
  downloads the PLCs in CRD's exact CSV format (`register/crdExport.ts`,
  checked against a row of the CRD export). Entries saved before (one per
  code) are turned into version 1 when read or restored
  (`model/legacyCodes.ts`); Tiamat converts its table the same way
  (migration V2).
- **Deadlines** (section 11, still "proposed"): working days from T0,
  Monday to Friday, minus the time a request for information ran. Agency
  holidays go in `AGENCY_HOLIDAYS` (`workflow/workingDays.ts`), empty for now.

Known limits of this first version:

- **Storage is the browser unless Tiamat is configured.** By default
  requests and codes stay in this browser (`store/browserStore.ts`, local
  storage), and the ⋮ menu downloads and restores a JSON backup. With
  `"locationCodesApiUrl": "https://<tiamat>/era/v1/location-codes"` in
  `bootstrap.json`, they live in Tiamat instead (`store/tiamatStore.ts`;
  backend: dagosan/tiamatLCs, `master`,
  `tiamat-core/src/ext/resources/docs/era-location-codes.md`). The ⋮ menu
  shows where the data is; restoring a browser backup into Tiamat is how
  existing requests move there (entries already there are skipped; a
  backup that disagrees is refused whole).
- **Who takes the steps (since 2026-10-30).** The page never saves a request
  it changed itself: it asks the store to _submit_ a request or _take a
  step_ (`LocationCodeStore.submitRequest` / `takeStep`), sending the
  action, the actor, the payload and how many events the copy on screen
  has. With Tiamat, Tiamat decides: whether the step can be taken from the
  request's status, by that role, by that person (submitter, four eyes),
  and what must come first; then it works out the step's changes itself
  (status, dates, reference, decision, register entries) and re-checks
  every code against the KG. Its refusals come back as the same
  `rinf_lc_blocked_…` text keys the page uses. Without Tiamat, the browser
  store applies the same rules (`store/browserWorkflow.ts`), so both modes
  refuse the same steps. The page still shows only the steps the actor
  can take (`workflow/availableActions.ts`); **a rule changed here must be
  changed in Tiamat's `workflow/` too.** The results of the technical
  checks and the value to assign are still worked out in the browser
  (they need its KG lookups) and sent as the step's payload.
- **Login (since 2026-11-01).** With `"locationCodesLoginRequired": true`
  and an `oidcConfig` in `bootstrap.json`, requests, amendments and every
  Agency step need a login (`login/`): the register of codes stays public,
  the other views ask to log in (`login/LoginGate.tsx`). The account's
  roles come from the token claim named by `claimsNamespace` (on the NAS
  `lcm_roles`), its name from `preferredNameNamespace`; the "Acting as"
  switch offers only the account's own roles, and the ⋮ data menu is for
  code administrators. Every call to Tiamat carries the access token, and
  Tiamat (with `ERA_LOCATION_CODES_LOGIN_REQUIRED=true`) takes the actor's
  name from the token and refuses a role the account does not hold.
  Without the switch, roles are picked by hand as before (the "Acting as"
  switch and a name), which is what development and the tests use.
  Not yet: Tiamat lets a logged-in requester read every request, not only
  their own; the page shows only theirs.
- **The page depends on the role** (`page/RoleViews.tsx`). A requester gets
  New request (the form, also the tab's landing page), My requests
  (`/location-codes/mine`, only their own) and Code register, with no
  queue of other cases. Agency roles get Requests (the queue on the left,
  the open case on the right) and Code register, with no request form:
  `/new` and `/mine` lead back to the queue, and the OP panel's "Request a
  location code" button shows for requesters only.
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
| `model/`                                      | Request, code versions (CRD columns), code types, TD 103 Table 6, Art. 3(9) categories, Annex A and B, code format    |
| `workflow/`                                   | Who may take which step (`availableActions`), the steps themselves (`applyAction`), four eyes, deadlines, publication |
| `checks/`                                     | Admissibility, the KG queries, and the technical checks                                                               |
| `store/`                                      | The storage contract, the browser and Tiamat implementations, and which one is used                                   |
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

**Starting from a point on the map** (`mapLocation/`, 2026-11-09).
Right-clicking the map (long press on touch screens) opens a menu with the
point's coordinates and "Use this location". The next step asks for the
reference OP: the 10 nearest valid today within 20 km, nearest first by
straight-line distance (same query as the OP layer on a 40 km box, ~1 s),
and as the last choice "Pick another operational point on the map", which
picks like above but only OPs can be used. A pin marks the point meanwhile.
The new request opens with the point as CRD latitude/longitude and the OP as
its RINF element; name, country and IM come from RINF as usual, the OP's
position does not (`positionFromMap` in the slice; `holdsMapPosition`).
Only for a requester, and not while a form is already waiting for a pick.

### Master data (2026-11-10)

From the LCMS specification (FR-27, 5.2, 5.5): the countries codes are
assigned for and the subsidiary location code types are data the code
administrator maintains, no longer lists in the code.

- Page `/location-codes/master-data` (view "Master data", `masterData/`):
  everyone reads the two lists; a code administrator adds and edits entries.
  An entry is never removed: it gets a last valid day.
- A country (`model/masterData.ts`): prefix (ISO alpha-2, or `EU`), UIC
  country code, name, EU Member State, the numbers a new PLC can take,
  validity. A subsidiary type: code, name, the requesters TD 103 Table 6
  names, retail-related, validity.
- Where they live: with Tiamat, its tables (`GET /countries`,
  `GET /subsidiary-types`, `PUT` for one entry); without, this browser
  (`store/browserMasterData.ts`). Both start with the same lists
  (`model/defaultCountries.ts`, `model/defaultSubsidiaryTypes.ts`; Tiamat:
  `DefaultMasterData.java`): 39 prefixes and the 48 XSD types.
- What reads them: the country list and the type list of the request form
  (entries valid today), the admissibility check (a proposed new PLC outside
  the country's numbers is refused), the value to assign (lowest free number
  of the country's range), the parent/type check, and the routing to
  external coordination (country not an EU Member State). The rules are
  plain functions, so they read `model/masterDataRegistry.ts`, which
  `state/masterDataThunks.ts` fills from the store; until then, and if the
  store cannot be read, the built-in lists apply.
- A submitted request always carries its country: the form asks for it only
  when a PLC is created, so otherwise it is the prefix of the PLC concerned
  (`model/requestCountry.ts`). Tiamat needs it for every request.
- Not taken from the specification: definition text, allocation entity,
  code format per type, German and French country names. The backup file
  does not carry master data.

### Drafts, and a requester's own requests (2026-11-10)

From the LCMS specification (state "Draft"; a requester amends own drafts and
views own requests).

- "Save as draft" on the request form saves it as it is, without checks; the
  draft is listed under "My requests" with "Continue" (`/location-codes/new?draft=<id>`)
  and "Discard". Submitting the form removes its draft.
- A draft is not a request (`model/RequestDraft.ts`): no status, history or
  reference, and the Agency never sees it, so the request statuses are as
  before. It belongs to the actor's name (with a login: the account).
  Continuing a draft keeps what was typed; RINF does not fill it in again.
- Where they live: with Tiamat, its `/drafts` endpoints; without, this
  browser (`store/browserDrafts.ts`).
- With a login, Tiamat returns to a requester's account only the requests
  it submitted. Without one it cannot tell who asks, and the list is
  filtered here as before (`page/hooks/useVisibleRequests.ts`).

### Bulk requests, first part: the file check (2026-11-10)

From the LCMS specification (FR-08) and its Annex A, "Structure of the bulk
request CSV file" (drafted with it, not yet confirmed). View "Bulk request"
(`/location-codes/bulk`, requesters only; `bulk/`): the requester chooses a
CSV file and gets the report per line. The check itself creates and sends
nothing; sending the accepted lines is the second part, below.

- The file (`bulk/bulkColumns.ts`): header with the annex's 24 column names
  (CRD's where the meaning is the same), any order, comma separated, UTF-8,
  RFC 4180 quoting, one line per new PLC or SLC, at most 500. "Download
  template" gives the header line.
- File checks (`bulk/bulkFile.ts`) refuse the whole file: not UTF-8, a quote
  left open, no header, unknown or repeated column names, a column missing
  that its lines require, no line, more than 500 lines.
- Line checks (`bulk/checkBulkLines.ts`), all failures reported: each column's
  form (`bulkLineChecks.ts`, `bulkPrimaryChecks.ts`, `bulkSubsidiaryChecks.ts`);
  the master data (country, subsidiary type, numbers for new PLCs); the codes
  that exist (`bulkRegisterChecks.ts`: a proposed value not in the register,
  an SLC's parent active when the SLC starts); and the other lines
  (`bulkCrossChecks.ts`: the same code proposed twice, an SLC whose parent is
  asked for in the same file).
- The parent of an SLC is looked for in the register first, then in the
  Knowledge Graph (one query per country). If the Knowledge Graph cannot be
  reached those lines are refused and the page says so.
- The report (`bulk/bulkReportCsv.ts`) is the annex's: `line, result,
  item_ref, column, rule, message`, one row per accepted line and one per
  failure. `item_ref` is empty: a line gets its reference at registration.
- Where the check differs from the annex's wording: a proposed PLC that the
  Knowledge Graph already holds is accepted when the register does not hold
  it (first population of an existing code); `Responsible_IM_Code` and
  `Allocation_Company_Code` are checked for their form only (the tool has no
  company table); `RINF_Element_Id` is not looked up; `NUTS_Code` is checked
  for length only.

### Bulk requests, second part: one request with a line per code (2026-11-10)

FR-08: the accepted lines of a file become one request. **Browser store only
so far**: with Tiamat the submission is refused with a message
(`rinf_lc_bulk_error_not_in_tiamat`); the server side is not written.

- Model: each accepted line is a request of its own with `bulk: {id, line,
  fileName}` (`model/LocationCodeRequest.ts`). The lines of a file share the
  bulk id, are submitted at the same moment, and are registered together:
  one number from the year's sequence, one T0, and each line's reference is
  that reference plus its line number in the file, `LC-2026-0001/3`
  (`store/browserBulk.ts`). A line cannot be registered on its own.
- Each line then goes through the ordinary workflow, with its own checks,
  RINF position, coordination, decision and history, so every rule applies
  per line and nothing of the workflow was rewritten.
- Sending (`bulk/BulkSubmitSection.tsx`, `bulk/bulkLineToRequest.ts`): after
  the check, the requester gives their details once, confirms step 1 for
  every line and submits the accepted lines. A proposed PLC the Knowledge
  Graph already holds becomes "existing code" (first population), any other
  line "new code". `RINF_Element_Id` is taken as an operational point.
  `Start_Validity` and the validity dates of freight and passenger use are
  not carried: a request has no place for them, the dates follow from the
  decision.
- The bulk request's page (`/location-codes/bulk/<id>`, `bulk/file/`):
  reference, file, T0, how many lines stand in each status, the lines with
  what their checks leave to read, and the steps the current role can take
  on all lines. In the lists a bulk request is one item
  (`page/RequestGroupItem.tsx`); a line's own file links back to it.
- Steps on all lines (`bulk/bulkRequests.ts`, `bulk/file/hooks/useBulkBatch.ts`):
  register; run checks; confirm manual checks; complete validation;
  confirm RINF position; assign; record and publish; notify and close. Each
  is the ordinary step taken line by line by the current actor. Left to the
  line's own file: anything that needs a reason or a choice (information
  request, rejection, external coordination, a line without a RINF element),
  and completing validation where the checks leave something to read (a
  failed check, a warning, or other codes already on the element). The
  warning that an existing code is in the Knowledge Graph for its own
  element does not hold a line back: that is first population.
- Measured with 50 lines and the live Knowledge Graph: checks about 36 s,
  assignment about 36 s, the other steps 3 to 12 s each.

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
- `src/config/ConfigContext.ts` — `rinfSparqlEndpoint`, `locationCodesApiUrl` and
  `locationCodesLoginRequired` config fields
- `src/auth/auth.tsx` — a login address starting with `/` is resolved against
  the app's own address, so one `bootstrap.json` works on any host name
- `src/static/lang/en.json`, `nb.json` — `rinf_*` text keys (`nb.json` holds
  English placeholders, to keep upstream's rule that both files carry every key)

## Licence and notices

Distributed under the same licence as Abzu (EUPL 1.2). Each file here starts
with the EUPL notice used upstream, followed by a line saying it was added for
the ERA RINF frontend and when. Upstream files we touch carry a line in their
header: `Modified for the ERA RINF frontend, <date>: <what changed>`. The JSON
language files cannot hold comments; their RINF keys all start with `rinf_`.
