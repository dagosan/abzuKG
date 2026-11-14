<!-- Added for the ERA Location Code Manager, 2026-11-14. Licensed under the EUPL 1.2. -->

# Change log

Changes to the Location Code Manager (ERA's application built on this fork of
Entur's Abzu), newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

This is the Location Code Manager's own number
(`src/rinf/version.ts`, shown in the header's help menu and in
`/version.txt`). The `version` in `package.json` is Abzu's and follows
upstream: the fork started from Abzu 1.666.0.

For a new version: raise the number in `src/rinf/version.ts` and add its
entry at the top of this file, in the same commit (`src/rinf/version.test.ts`
checks the two agree). Numbers below 1.0.0 mean the tool is not yet in
service: publication to the Knowledge Graph is still to come.

Versions before 0.9.0 were numbered afterwards, from the history of `master`.

## [0.9.0] - 2026-11-14

Goes with tiamatLCs `master` at 522bc2a (register migrations V3 and V4, which
only add tables).

### Added

- Master data: the countries codes are assigned for and the subsidiary
  location code types are lists the code administrator maintains
  (view "Master data"), no longer lists in the code. A proposed new PLC must
  be within its country's numbers.
- Request drafts: "Save as draft" on the request form; drafts are listed
  under "My requests" with "Continue" and "Discard".
- With a login, the register returns to a requester only the requests that
  account submitted.
- A version number and this change log; the version shows in the header's
  help menu and in `/version.txt`.

### Fixed

- A request for an SLC, or to amend or deactivate a PLC, was refused by the
  register because it carried no country. It now carries the prefix of the
  PLC concerned.

## [0.8.0] - 2026-11-14

### Added

- Bulk requests: a CSV file of up to 500 new codes is checked line by line,
  with a report; the accepted lines are sent as one request with a line per
  code, in the browser store and in the register (Tiamat).
- Steps of a bulk request are taken on the lines ticked in its table.
- "Reset" and "Cancel" on the new request form.
- The NAS can update itself when `master` has a new commit
  (`deploy/auto-update.sh`).

## [0.7.0] - 2026-11-09

### Added

- Right-clicking the map offers "Use this location": a request starts from
  that point, with a reference operational point chosen among the nearest.

## [0.6.0] - 2026-11-02

### Changed

- The register follows CRD's location table: one row per version of a code,
  with CRD's 22 columns. An amendment starts a new version. Entries saved
  before are turned into version 1.

### Added

- The register page lists every version and downloads the PLCs in CRD's CSV
  format.

## [0.5.0] - 2026-11-01

### Added

- Login (Keycloak on the NAS): requests, amendments and every Agency step
  need an account, and the account's roles decide what it can do. The map,
  the search, the RINF reports and the register of codes stay public.
- Location codes on the map: labels under operational points and on sections
  of line, told apart by whether the code is in RINF, in the register or in
  both.

## [0.4.0] - 2026-10-30

### Added

- The location code register in Tiamat (dagosan/tiamatLCs): requests and
  codes are kept on the server, which decides each step of the workflow.
  Without it they stay in the browser, under the same rules.
- The register runs on the NAS next to the app (Tiamat and PostGIS in the
  same Docker stack); the app's port is a setting.
- ERA theme: colours, logo and favicon.

### Changed

- The application is named Location Code Manager.

## [0.3.0] - 2026-10-29

### Added

- Location code allocation workflow for primary and subsidiary location
  codes, following the Agency's procedure step by step: request form,
  request file, checks against the Knowledge Graph, four-eyes rule,
  deadlines, register of codes.
- The RINF element comes first on the form and fills it in; it can be picked
  from a map. The page depends on the role acted in.
- Docker image and install script for a server or NAS.

## [0.2.0] - 2026-10-29

### Added

- Header search for operational points and sections of line.
- RINF reports: search by parameter value, results table, CSV export and
  "Show on map".

### Fixed

- Header height and the map credit on report pages.

## [0.1.0] - 2026-10-28

### Added

- RINF data from ERA's Knowledge Graph on Abzu's modern map: operational
  points and sections of line.
- Details panel with every parameter of an operational point or section of
  line.
