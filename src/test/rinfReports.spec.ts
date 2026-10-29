/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA RINF frontend, 2026-10-29. */

import { describe, expect, it } from "vitest";
import {
  buildSearchResultsGeoJson,
  searchResultsBounds,
} from "../rinf/map/searchResultsGeoJson";
import type { PlaceMatch } from "../rinf/models/parameterMatches";
import { toCsv } from "../rinf/reports/csv";
import { cellValue, sortPlaces } from "../rinf/reports/reportColumns";
import { cameFromReport } from "../rinf/reports/reportNavigation";

const place = (overrides: Partial<PlaceMatch>): PlaceMatch => ({
  kind: "sectionOfLine",
  canonicalId: "0504_BEFLT_BEFIA",
  name: "Aalter - Maria-Aalter",
  countryCode: "BEL",
  lineNumber: "0504",
  imCode: "0088",
  matches: 2,
  elementTypeUri: "http://data.europa.eu/949/RunningTrack",
  lines: [
    [
      [3.45, 51.08],
      [3.37, 51.1],
    ],
  ],
  lngLat: null,
  ...overrides,
});
const context = {
  kindLabel: () => "Section of line",
  elementTypeLabel: () => "Running track",
};

describe("report cells", () => {
  it("show the line, the IM and the matching elements", () => {
    const section = place({});
    expect(cellValue("rinfLine", section, context)).toBe("0504");
    expect(cellValue("rinfIm", section, context)).toBe("0088");
    expect(cellValue("rinfMatches", section, context)).toBe(
      "2 × Running track",
    );
    expect(
      cellValue("rinfMatches", place({ elementTypeUri: null }), context),
    ).toBe("2");
  });

  it("sort by name, numbers in numeric order", () => {
    const sorted = sortPlaces([
      place({ name: "Line 10" }),
      place({ name: "Line 2" }),
    ]);
    expect(sorted.map(({ name }) => name)).toEqual(["Line 2", "Line 10"]);
  });
});

describe("toCsv", () => {
  it("quotes what needs it and defuses spreadsheet formulas", () => {
    expect(
      toCsv(
        ["Name", "IM"],
        [
          ['Poznań; "Główny"', "=1+1"],
          ["Gembloux", "0088"],
        ],
      ),
    ).toBe('Name;IM\r\n"Poznań; ""Główny""";\'=1+1\r\nGembloux;0088');
  });
});

describe("results on the map", () => {
  it("draw sections as lines and OPs as points, skipping those without a place", () => {
    const geoJson = buildSearchResultsGeoJson([
      place({}),
      place({
        kind: "operationalPoint",
        canonicalId: "BEFLT",
        lines: [],
        lngLat: [3.45, 51.08],
      }),
      place({ canonicalId: "NO_SHAPE", lines: [] }),
    ]);
    expect(geoJson.features.map(({ geometry }) => geometry.type)).toEqual([
      "MultiLineString",
      "Point",
    ]);
  });

  it("fit around every position", () => {
    expect(
      searchResultsBounds([
        place({}),
        place({ kind: "operationalPoint", lines: [], lngLat: [4.35, 50.85] }),
      ]),
    ).toEqual([
      [3.37, 50.85],
      [4.35, 51.1],
    ]);
    expect(searchResultsBounds([place({ lines: [] })])).toBeNull();
  });
});

describe("cameFromReport", () => {
  it("is true only for the report's navigation state", () => {
    expect(cameFromReport({ fromReport: true })).toBe(true);
    expect(cameFromReport(null)).toBe(false);
    expect(cameFromReport({ fromReport: "yes" })).toBe(false);
  });
});
