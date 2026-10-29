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
import { conditionPattern } from "../rinf/api/conditionPattern";
import { buildParameterSearchQuery } from "../rinf/api/parameterSearchQuery";
import { countryValues, datasetValues } from "../rinf/api/scopePatterns";
import {
  criteriaFromSearchParams,
  criteriaKey,
  criteriaToSearchParams,
  isComplete,
  ParameterCriteria,
} from "../rinf/models/parameterCriteria";

const ERA = "http://data.europa.eu/949/";
const SPEED_SEARCH: ParameterCriteria = {
  property: "maximumPermittedSpeed",
  operator: "greaterOrEqual",
  value: "160",
  countries: ["BEL", "NLD"],
  infrastructureManagers: [],
};

describe("parameter criteria in the address", () => {
  it("survive a round trip", () => {
    const params = criteriaToSearchParams(SPEED_SEARCH);
    expect(params.toString()).toBe(
      "parameter=maximumPermittedSpeed&condition=greaterOrEqual&value=160&country=BEL%2CNLD",
    );
    expect(criteriaFromSearchParams(params)).toEqual(SPEED_SEARCH);
  });

  it("drop anything malformed", () => {
    const params = new URLSearchParams(
      "parameter=bad property&condition=drop&country=BEL,be,XX;&im=0088,abc",
    );
    expect(criteriaFromSearchParams(params)).toEqual({
      property: "",
      operator: "is",
      value: "",
      countries: ["BEL"],
      infrastructureManagers: ["0088"],
    });
  });

  it("are complete only with a value when the operator needs one", () => {
    expect(isComplete(SPEED_SEARCH)).toBe(true);
    expect(isComplete({ ...SPEED_SEARCH, value: "" })).toBe(false);
    expect(
      isComplete({ ...SPEED_SEARCH, operator: "notYetAvailable", value: "" }),
    ).toBe(true);
  });

  it("give the same key for the same search", () => {
    expect(criteriaKey(SPEED_SEARCH)).toBe(criteriaKey({ ...SPEED_SEARCH }));
    expect(criteriaKey(SPEED_SEARCH)).not.toBe(
      criteriaKey({ ...SPEED_SEARCH, value: "200" }),
    );
  });
});

describe("conditionPattern", () => {
  it("matches a code by its URI", () => {
    const code = `${ERA}energy-supply-systems/DC_3kV`;
    expect(conditionPattern("energySupplySystem", "is", code)).toBe(
      `?element era:energySupplySystem <${code}> .`,
    );
  });

  it("compares numbers, accepting a decimal comma", () => {
    expect(conditionPattern("length", "lessOrEqual", "1,5")).toContain(
      "FILTER(?value <= 1.5)",
    );
  });

  it("escapes text and compares it case-insensitively", () => {
    expect(conditionPattern("tunnelIdentification", "contains", 'a"b')).toBe(
      '?element era:tunnelIdentification ?value . FILTER(CONTAINS(LCASE(STR(?value)), LCASE("a\\"b")))',
    );
  });

  it("finds parameters declared not applicable or not yet available", () => {
    expect(conditionPattern("gradient", "notApplicable", "")).toBe(
      "?element era:notApplicable era:gradient .",
    );
    expect(conditionPattern("gradient", "notYetAvailable", "")).toBe(
      "?element era:notYetAvailable era:gradient .",
    );
  });

  it("refuses values that could change the query", () => {
    expect(() =>
      conditionPattern("speed", "is", "http://x> . ?a ?b <y"),
    ).toThrow();
    expect(() =>
      conditionPattern("speed", "greaterOrEqual", "1; DROP"),
    ).toThrow();
    expect(() => conditionPattern("speed } UNION {", "hasValue", "")).toThrow();
  });
});

describe("scope patterns", () => {
  it("list IM datasets and countries, or nothing when unrestricted", () => {
    expect(datasetValues(null)).toBe("");
    expect(datasetValues(["0088"])).toBe(
      `VALUES ?dataset { <${ERA}graph/0088> }`,
    );
    expect(countryValues([])).toBe("");
    expect(countryValues(["BEL"])).toContain("/country/BEL>");
    expect(() => datasetValues(["00 88"])).toThrow();
    expect(() => countryValues(["be"])).toThrow();
  });
});

describe("buildParameterSearchQuery", () => {
  const query = buildParameterSearchQuery(
    SPEED_SEARCH,
    [{ how: "partOf" }, { how: "viaTrack", link: `${ERA}contactLineSystem` }],
    ["0088", "0084"],
    5000,
    "2026-10-29",
  );

  it("follows each attachment once and limits to the chosen scope", () => {
    expect(query).toContain("{ ?element era:isPartOf ?place . }");
    expect(query).toContain(
      `{ ?track <${ERA}contactLineSystem> ?element ; era:isPartOf ?place . }`,
    );
    expect(query).toContain(`<${ERA}graph/0088> <${ERA}graph/0084>`);
    expect(query).toContain("/country/BEL> <");
    expect(query).toContain("LIMIT 5000");
  });

  it("refuses a search that reaches no place, or an unsafe link", () => {
    expect(() =>
      buildParameterSearchQuery(SPEED_SEARCH, [], null, 10, "2026-10-29"),
    ).toThrow();
    expect(() =>
      buildParameterSearchQuery(
        SPEED_SEARCH,
        [{ how: "viaTrack", link: "http://x> ?y" }],
        null,
        10,
        "2026-10-29",
      ),
    ).toThrow();
  });
});

describe("objects linked from the place", () => {
  it("are searched through the link from the section or OP", () => {
    const query = buildParameterSearchQuery(
      {
        property: "primaryLocationCode",
        operator: "equals",
        value: "BE00438",
        countries: [],
        infrastructureManagers: [],
      },
      [{ how: "fromPlace", link: `${ERA}primaryLocation` }],
      null,
      10,
      "2026-10-29",
    );
    expect(query).toContain(`{ ?place <${ERA}primaryLocation> ?element . }`);
    expect(query).toContain('STR(?value) = "BE00438"');
  });
});
