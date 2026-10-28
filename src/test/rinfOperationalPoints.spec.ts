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

Added for the ERA RINF frontend, 2026-10-28. */

import { describe, expect, it } from "vitest";
import { buildOperationalPointsQuery } from "../rinf/api/operationalPointsQuery";
import type { SparqlBinding } from "../rinf/api/sparqlClient";
import { buildOperationalPointsGeoJson } from "../rinf/map/buildOperationalPointsGeoJson";
import {
  toOperationalPoint,
  toOperationalPoints,
} from "../rinf/models/OperationalPoint";
import {
  fetchOperationalPointsInBox,
  operationalPointsReducer as reducer,
  setShowOperationalPoints,
} from "../rinf/state/operationalPointsSlice";

const BUIZINGEN_ROW: SparqlBinding = {
  op: {
    type: "uri",
    value: "http://data.europa.eu/949/operationalPoint/40198f8e28",
  },
  id: { type: "literal", value: "BEFGU" },
  canonicalUri: {
    type: "uri",
    value: "http://data.europa.eu/949/operationalPoint/BEFGU",
  },
  label: { type: "literal", value: "Buizingen" },
  latitude: { type: "literal", value: "5.0751581E1" },
  longitude: { type: "literal", value: "4.258561E0" },
};

describe("buildOperationalPointsQuery", () => {
  const query = buildOperationalPointsQuery(
    { south: 50.75, west: 4.2, north: 50.95, east: 4.55 },
    5000,
    "2026-10-28",
  );

  it("keeps only OP versions valid on the given date", () => {
    expect(query).toContain('?opValidFrom <= "2026-10-28"^^xsd:date');
    expect(query).toContain('?opValidTo >= "2026-10-28"^^xsd:date');
  });

  it("refuses a malformed date rather than sending it to the endpoint", () => {
    expect(() =>
      buildOperationalPointsQuery(
        { south: 0, west: 0, north: 1, east: 1 },
        10,
        '2026" } DROP',
      ),
    ).toThrow();
  });

  it("filters on the bounding box", () => {
    expect(query).toContain("?lat >= 50.750000 && ?lat <= 50.950000");
    expect(query).toContain("?lng >= 4.200000 && ?lng <= 4.550000");
  });

  it("keeps only current-model OPs, one row each", () => {
    expect(query).toContain(
      'STRSTARTS(STR(?op), "http://data.europa.eu/949/operationalPoint/")',
    );
    expect(query).toContain("GROUP BY ?op");
    expect(query).toContain("era:canonicalURI ?canonical");
    expect(query).toContain("LIMIT 5000");
  });
});

describe("toOperationalPoint", () => {
  it("maps a full row, parsing scientific-notation coordinates", () => {
    expect(toOperationalPoint(BUIZINGEN_ROW)).toEqual({
      uri: "http://data.europa.eu/949/operationalPoint/40198f8e28",
      canonicalId: "BEFGU",
      uopid: "BEFGU",
      name: "Buizingen",
      lat: 50.751581,
      lng: 4.258561,
    });
  });

  it("falls back to the UOPID when the OP has no name", () => {
    const { label, ...withoutName } = BUIZINGEN_ROW;
    expect(toOperationalPoint(withoutName)?.name).toBe("BEFGU");
  });

  it("drops rows without a canonical id, which the panel link needs", () => {
    const { canonicalUri, ...withoutId } = BUIZINGEN_ROW;
    expect(toOperationalPoint(withoutId)).toBeNull();
  });

  it("drops rows without a usable position", () => {
    const broken = {
      ...BUIZINGEN_ROW,
      latitude: { type: "literal" as const, value: "" },
    };
    expect(toOperationalPoints([broken, BUIZINGEN_ROW])).toHaveLength(1);
  });
});

describe("buildOperationalPointsGeoJson", () => {
  it("writes coordinates in GeoJSON [lng, lat] order", () => {
    const points = toOperationalPoints([BUIZINGEN_ROW]);
    const [feature] = buildOperationalPointsGeoJson(points).features;
    expect(feature.geometry.coordinates).toEqual([4.258561, 50.751581]);
    expect(feature.properties.canonicalId).toBe("BEFGU");
  });
});

describe("operationalPointsSlice", () => {
  const loaded = reducer(
    undefined,
    fetchOperationalPointsInBox.fulfilled(
      toOperationalPoints([BUIZINGEN_ROW]),
      "request-1",
      {
        endpoint: "https://example.org",
        box: { south: 0, west: 0, north: 1, east: 1 },
      },
    ),
  );

  it("stores loaded OPs; a partial page is not truncated", () => {
    expect(loaded.items).toHaveLength(1);
    expect(loaded.truncated).toBe(false);
    expect(loaded.status).toBe("loaded");
  });

  it("remembers the layer being switched off", () => {
    expect(reducer(loaded, setShowOperationalPoints(false)).show).toBe(false);
  });
});
