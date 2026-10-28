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
import { buildOperationalPointSearchQuery } from "../rinf/api/operationalPointSearchQuery";
import { sparqlStringLiteral } from "../rinf/api/queryParts";
import type { SparqlBinding, SparqlTerm } from "../rinf/api/sparqlClient";
import { toDetailsTrees } from "../rinf/models/detailsTree";
import { toOperationalPointSearchResult } from "../rinf/models/OperationalPointSearchResult";
import { positionFromBinding } from "../rinf/models/rootPosition";
import {
  searchOperationalPoints,
  searchReducer,
  setSearchMode,
} from "../rinf/state/searchSlice";

const ERA = "http://data.europa.eu/949/";
const uri = (value: string): SparqlTerm => ({ type: "uri", value });
const literal = (value: string): SparqlTerm => ({ type: "literal", value });

describe("sparqlStringLiteral", () => {
  it("escapes quotes, backslashes and line breaks", () => {
    expect(sparqlStringLiteral('CALO\' "x" \\ \n')).toBe(
      '"CALO\' \\"x\\" \\\\ \\n"',
    );
  });
});

describe("buildOperationalPointSearchQuery", () => {
  const query = buildOperationalPointSearchQuery("  Gembl  ", 20, "2026-10-29");

  it("matches names, UOPIDs and location codes with the trimmed text", () => {
    expect(query).toContain('CONTAINS(LCASE(STR(?anyName)), LCASE("Gembl"))');
    expect(query).toContain('STRSTARTS(LCASE(STR(?anyId)), LCASE("Gembl"))');
    expect(query).toContain('STRSTARTS(LCASE(STR(?anyCode)), LCASE("Gembl"))');
  });

  it("ranks exact ids first and keeps OPs without a location code ranked", () => {
    expect(query).toContain('COALESCE(?code, "")');
    expect(query).toContain("ORDER BY ?bestRank");
    expect(query).toContain("LIMIT 20");
  });

  it("cannot be broken out of with quotes", () => {
    const hostile = buildOperationalPointSearchQuery(
      'x") } DROP ALL { ("',
      5,
      "2026-10-29",
    );
    expect(hostile).toContain('LCASE("x\\") } DROP ALL { (\\"")');
  });
});

describe("search results", () => {
  it("maps a row with code, type and country", () => {
    expect(
      toOperationalPointSearchResult({
        canonical: uri(`${ERA}operationalPoint/BELGB`),
        id: literal("BELGB"),
        label: literal("Gembloux"),
        locationCode: literal("BE00438"),
        type: literal("station"),
        inCountry: uri(
          "http://publications.europa.eu/resource/authority/country/BEL",
        ),
      }),
    ).toEqual({
      canonicalId: "BELGB",
      name: "Gembloux",
      uopid: "BELGB",
      locationCode: "BE00438",
      type: "station",
      countryCode: "BEL",
    });
  });

  it("keeps the mode, and ignores results for text no longer searched", () => {
    const rinf = searchReducer(undefined, setSearchMode("stopPlaces"));
    expect(rinf.mode).toBe("stopPlaces");
    const args = { endpoint: "https://example.org", text: "gembl" };
    const pending = searchReducer(
      rinf,
      searchOperationalPoints.pending("r1", args),
    );
    const newer = searchReducer(
      pending,
      searchOperationalPoints.pending("r2", { ...args, text: "gemblo" }),
    );
    const stale = searchReducer(
      newer,
      searchOperationalPoints.fulfilled([], "r1", args),
    );
    expect(stale.status).toBe("loading");
  });
});

describe("element positions", () => {
  it("reads an OP's coordinates from its net reference", () => {
    expect(
      positionFromBinding({
        oLat: literal("50.571292"),
        oLng: literal("4.690778"),
      }),
    ).toEqual([50.571292, 4.690778]);
  });

  it("takes the middle of a section of line's shape", () => {
    expect(
      positionFromBinding({ oWkt: literal("LINESTRING (4.0 50.0, 5.0 51.0)") }),
    ).toEqual([50.5, 4.5]);
  });

  it("gives the root its position from the details rows", () => {
    const rows: SparqlBinding[] = [
      {
        level: literal("0"),
        subject: uri(`${ERA}operationalPoint/76ad36dda2`),
        p: uri(`${ERA}netReference`),
        o: uri(`${ERA}netReference/1c197068b6`),
        oLat: literal("50.571292"),
        oLng: literal("4.690778"),
      },
    ];
    expect(toDetailsTrees(rows)[0].position).toEqual([50.571292, 4.690778]);
  });
});
