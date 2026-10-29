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

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSectionOfLineSearchQuery } from "../rinf/api/sectionOfLineSearchQuery";
import * as sparqlClient from "../rinf/api/sparqlClient";
import type { SparqlTerm } from "../rinf/api/sparqlClient";
import {
  combineSearchResults,
  searchResultKey,
} from "../rinf/models/RinfSearchResult";
import { toSectionOfLineSearchResult } from "../rinf/models/SectionOfLineSearchResult";
import { searchRinf } from "../rinf/state/searchSlice";

const ERA = "http://data.europa.eu/949/";
const COUNTRY = "http://publications.europa.eu/resource/authority/country/";
const uri = (value: string): SparqlTerm => ({ type: "uri", value });
const literal = (value: string): SparqlTerm => ({ type: "literal", value });

describe("buildSectionOfLineSearchQuery", () => {
  const query = buildSectionOfLineSearchQuery(" 0504 ", 40, "2026-10-29");

  it("matches line numbers, ids and names with the trimmed text", () => {
    expect(query).toContain('STRSTARTS(LCASE(STR(?anyLineId)), LCASE("0504"))');
    expect(query).toContain(
      'CONTAINS(LCASE(STRAFTER(STR(?anyCanonical), "/sectionOfLine/")), LCASE("0504"))',
    );
    expect(query).toContain("LIMIT 40");
  });

  it("matches names without the label's boilerplate", () => {
    expect(query).toContain(
      'REPLACE(REPLACE(STR(?anyLabel), "^(Section of Line |\\\\[[^\\\\]]*\\\\] SOL )", ""), " \\\\(from [^)]*\\\\)$", "")',
    );
  });

  it("cannot be broken out of with quotes", () => {
    expect(
      buildSectionOfLineSearchQuery('x") } DROP ALL { ("', 5, "2026-10-29"),
    ).toContain('LCASE("x\\") } DROP ALL { (\\"")');
  });
});

describe("section of line search results", () => {
  it("maps a row with line number and country", () => {
    expect(
      toSectionOfLineSearchResult({
        canonical: uri(`${ERA}sectionOfLine/0504_BEFLT_BEFIA`),
        label: literal(
          "Section of Line Aalter - Maria-Aalter (from 2024-12-15 until 2078-12-31)",
        ),
        line: literal("0504"),
        inCountry: uri(`${COUNTRY}BEL`),
      }),
    ).toEqual({
      canonicalId: "0504_BEFLT_BEFIA",
      name: "Aalter - Maria-Aalter",
      lineNumber: "0504",
      countryCode: "BEL",
    });
  });

  it("lists OPs before sections, with keys unique across kinds", () => {
    const combined = combineSearchResults(
      [
        {
          canonicalId: "X",
          name: "X",
          uopid: "X",
          locationCode: null,
          type: null,
          countryCode: null,
        },
      ],
      [{ canonicalId: "X", name: "X", lineNumber: null, countryCode: null }],
    );
    expect(combined.map(({ kind }) => kind)).toEqual([
      "operationalPoint",
      "sectionOfLine",
    ]);
    expect(new Set(combined.map(searchResultKey)).size).toBe(2);
  });
});

describe("searchRinf", () => {
  afterEach(() => vi.restoreAllMocks());

  const run = () =>
    searchRinf({ endpoint: "https://example.org", text: "aalter" })(
      vi.fn(),
      vi.fn(),
      undefined,
    );

  it("still shows sections when the OP search fails", async () => {
    vi.spyOn(sparqlClient, "runSparqlSelect").mockImplementation(
      async (_endpoint, query) => {
        if (query.includes("era:uopid")) throw new Error("timeout");
        return [
          {
            canonical: uri(`${ERA}sectionOfLine/0504_BEFLT_BEFIA`),
            label: literal("Section of Line Aalter - Maria-Aalter"),
          },
        ];
      },
    );
    const action = await run();
    expect(action.type).toBe(searchRinf.fulfilled.type);
    expect(action.payload).toMatchObject([{ kind: "sectionOfLine" }]);
  });

  it("fails only when both searches fail", async () => {
    vi.spyOn(sparqlClient, "runSparqlSelect").mockRejectedValue(
      new Error("down"),
    );
    expect((await run()).type).toBe(searchRinf.rejected.type);
  });
});
