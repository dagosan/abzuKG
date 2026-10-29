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
import type { SparqlTerm } from "../rinf/api/sparqlClient";
import { matchOpacity } from "../rinf/map/matchOpacity";
import {
  distinctAttachments,
  toAttachment,
} from "../rinf/models/parameterAttachments";
import { toPlaceMatch } from "../rinf/models/parameterMatches";
import { inferValueKind, ValueInUse } from "../rinf/models/parameterValues";
import { datasetsToSearch, toScopeOptions } from "../rinf/models/scopeOptions";
import {
  clearParameterSearch,
  parameterSearchReducer,
  setSearchPath,
} from "../rinf/state/parameterSearchSlice";

const ERA = "http://data.europa.eu/949/";
const XSD = "http://www.w3.org/2001/XMLSchema#";
const COUNTRY = "http://publications.europa.eu/resource/authority/country/";
const uri = (value: string): SparqlTerm => ({ type: "uri", value });
const literal = (value: string): SparqlTerm => ({ type: "literal", value });

const valueInUse = (overrides: Partial<ValueInUse>): ValueInUse => ({
  value: "x",
  label: null,
  uses: 1,
  isCode: false,
  datatype: null,
  ...overrides,
});

describe("inferValueKind", () => {
  it("takes the kind most of the uses have", () => {
    expect(
      inferValueKind([
        valueInUse({ datatype: `${XSD}double`, uses: 900 }),
        valueInUse({ uses: 3 }),
      ]),
    ).toBe("number");
    expect(inferValueKind([valueInUse({ isCode: true })])).toBe("code");
    expect(inferValueKind([valueInUse({ datatype: `${XSD}boolean` })])).toBe(
      "boolean",
    );
  });

  it("falls back to text when no value is in use", () => {
    expect(inferValueKind([])).toBe("text");
  });
});

describe("scope options", () => {
  const options = toScopeOptions([
    {
      graph: uri(`${ERA}graph/0088`),
      country: uri(`${COUNTRY}BEL`),
      countryName: literal("Belgium"),
      sections: literal("900"),
    },
    {
      graph: uri(`${ERA}graph/0084`),
      country: uri(`${COUNTRY}NLD`),
      countryName: literal("Netherlands"),
      sections: literal("700"),
    },
    {
      graph: uri(`${ERA}graph/0084`),
      country: uri(`${COUNTRY}BEL`),
      countryName: literal("Belgium"),
      sections: literal("2"),
    },
  ]);

  it("list IMs with their countries and countries by name", () => {
    expect(options.infrastructureManagers).toEqual([
      { code: "0088", countries: ["BEL"], sections: 900 },
      { code: "0084", countries: ["NLD", "BEL"], sections: 702 },
    ]);
    expect(options.countries.map(({ code }) => code)).toEqual(["BEL", "NLD"]);
  });

  it("turn chosen countries into the IM datasets active there", () => {
    expect(datasetsToSearch(options, [], [])).toBeNull();
    expect(datasetsToSearch(options, ["NLD"], [])).toEqual(["0084"]);
    expect(datasetsToSearch(options, ["BEL"], [])).toEqual(["0088", "0084"]);
    expect(datasetsToSearch(options, ["NLD"], ["0088"])).toEqual(["0088"]);
  });
});

describe("attachments", () => {
  it("take the most common way a probed type reaches a place", () => {
    expect(
      toAttachment([
        { how: literal("partOf"), sampled: literal("3") },
        {
          how: literal("viaTrack"),
          link: uri(`${ERA}contactLineSystem`),
          sampled: literal("197"),
        },
      ]),
    ).toEqual({ how: "viaTrack", link: `${ERA}contactLineSystem` });
    expect(
      toAttachment([{ how: literal("none"), sampled: literal("200") }]),
    ).toBeNull();
    expect(toAttachment([])).toBeNull();
  });

  it("are searched once each", () => {
    const link = `${ERA}contactLineSystem`;
    expect(
      distinctAttachments([
        { typeUri: "a", elements: 1, attachment: { how: "partOf" } },
        { typeUri: "b", elements: 1, attachment: { how: "partOf" } },
        { typeUri: "c", elements: 1, attachment: { how: "viaTrack", link } },
        { typeUri: "d", elements: 1, attachment: null },
      ]),
    ).toEqual([{ how: "partOf" }, { how: "viaTrack", link }]);
  });
});

describe("toPlaceMatch", () => {
  it("reads a section of line with its IM and match count", () => {
    expect(
      toPlaceMatch({
        placeType: uri(`${ERA}SectionOfLine`),
        canonical: uri(`${ERA}sectionOfLine/SOL_BE_1`),
        label: literal("Gembloux - Chapelle-Dieu"),
        inCountry: uri(`${COUNTRY}BEL`),
        imDataset: uri(`${ERA}graph/0088`),
        matches: literal("2"),
        elementType: uri(`${ERA}RunningTrack`),
      }),
    ).toMatchObject({
      kind: "sectionOfLine",
      canonicalId: "SOL_BE_1",
      countryCode: "BEL",
      imCode: "0088",
      matches: 2,
      elementTypeUri: `${ERA}RunningTrack`,
    });
  });

  it("skips rows without a usable id", () => {
    expect(
      toPlaceMatch({ placeType: uri(`${ERA}OperationalPoint`) }),
    ).toBeNull();
  });
});

describe("matchOpacity", () => {
  it("leaves the map alone with no search, and dims the rest during one", () => {
    expect(matchOpacity(null)).toBe(1);
    expect(matchOpacity(["A"])).toEqual([
      "case",
      ["in", ["get", "canonicalId"], ["literal", ["A"]]],
      1,
      0.15,
    ]);
  });
});

describe("parameterSearchReducer", () => {
  it("forgets the results and the way back when the search is closed", () => {
    const open = parameterSearchReducer(
      undefined,
      setSearchPath("/parameter-search?parameter=length"),
    );
    expect(open.searchPath).toBe("/parameter-search?parameter=length");
    const closed = parameterSearchReducer(open, clearParameterSearch());
    expect(closed.searchPath).toBeNull();
    expect(closed.resultsKey).toBeNull();
    expect(closed.places).toEqual([]);
  });
});
