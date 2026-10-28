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
import { buildSectionOfLineDetailsQuery } from "../rinf/api/sectionOfLineDetailsQuery";
import { buildSectionsOfLineQuery } from "../rinf/api/sectionsOfLineQuery";
import type { SparqlBinding, SparqlTerm } from "../rinf/api/sparqlClient";
import { sectionOfLineName } from "../rinf/models/labels";
import {
  compareByRinfIndex,
  ParameterDictionary,
} from "../rinf/models/ParameterDictionary";
import { toSectionOfLineSummary } from "../rinf/models/SectionOfLine";
import { toSectionOfLineDetails } from "../rinf/models/SectionOfLineDetails";
import { unitSymbol } from "../rinf/models/units";
import { parseWktLines } from "../rinf/models/wkt";
import { formatParameterValue } from "../rinf/panel/formatParameterValue";
import { toDisplayNode } from "../rinf/panel/visibleParameters";

const ERA = "http://data.europa.eu/949/";
const XSD = "http://www.w3.org/2001/XMLSchema#";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const uri = (value: string): SparqlTerm => ({ type: "uri", value });
const literal = (value: string, datatype?: string): SparqlTerm => ({
  type: "literal",
  value,
  datatype,
});
const formatMessage = ({ id }: { id: string }) => id;

describe("parseWktLines", () => {
  it("reads a LINESTRING as one [lng, lat] line", () => {
    expect(
      parseWktLines("LINESTRING (17.9231 59.6327, 17.9285 59.6491)"),
    ).toEqual([
      [
        [17.9231, 59.6327],
        [17.9285, 59.6491],
      ],
    ]);
  });

  it("reads each part of a MULTILINESTRING", () => {
    expect(
      parseWktLines("MULTILINESTRING ((1 2, 3 4), (5 6, 7 8, 9 10))"),
    ).toHaveLength(2);
  });

  it("returns nothing for shapes it cannot draw", () => {
    expect(parseWktLines("POINT (1 2)")).toEqual([]);
    expect(parseWktLines("LINESTRING (1 2)")).toEqual([]);
  });
});

describe("section of line summaries", () => {
  it("keeps the canonical id and a short name", () => {
    const summary = toSectionOfLineSummary({
      sol: uri(`${ERA}sectionOfLine/a10bfd42c5`),
      canonicalUri: uri(`${ERA}sectionOfLine/30_SEArne_SEArnc`),
      label: literal(
        "Section of Line Arlanda nedre - Arlanda central (from 2026-01-01 until 2026-12-31)",
      ),
      wkt: literal("LINESTRING (17.9231 59.6327, 17.9285 59.6491)"),
    });
    expect(summary?.canonicalId).toBe("30_SEArne_SEArnc");
    expect(summary?.name).toBe("Arlanda nedre - Arlanda central");
  });

  it("strips the validity period from names", () => {
    expect(sectionOfLineName("Section of Line A - B (from 2018-04-09)")).toBe(
      "A - B",
    );
  });
});

describe("section of line queries", () => {
  const box = { south: 50.75, west: 4.2, north: 50.95, east: 4.55 };

  it("finds SoLs whose shape crosses the box, valid on the date", () => {
    const query = buildSectionsOfLineQuery(box, 5000, "2026-10-28");
    expect(query).toContain(
      'geof:sfIntersects(?shape, "POLYGON((4.200000 50.750000, 4.550000 50.750000',
    );
    expect(query).toContain('?solValidFrom <= "2026-10-28"^^xsd:date');
  });

  it("refuses ids that could break out of the query", () => {
    expect(() =>
      buildSectionOfLineDetailsQuery("x> } DROP ALL { <y", "2026-10-28"),
    ).toThrow();
    expect(
      buildSectionOfLineDetailsQuery("1440_BELGB_BECAD", "2026-10-28"),
    ).toContain(`<${ERA}sectionOfLine/1440_BELGB_BECAD>`);
  });
});

const SOL = `${ERA}sectionOfLine/1`;
const TRACK_A = `${ERA}track/a`;
const TRACK_B = `${ERA}track/b`;
const SHARED_DETECTION = `${ERA}trackside/trainDetectionSystem/shared`;

const row = (
  level: string,
  subject: string,
  parent: string | null,
  predicate: string,
  object: SparqlTerm,
  objectLabel?: string,
): SparqlBinding => ({
  level: literal(level),
  subject: uri(subject),
  parent: parent ? uri(parent) : undefined,
  p: uri(predicate),
  o: object,
  oLabel: objectLabel ? literal(objectLabel) : undefined,
});

const DETAIL_ROWS: SparqlBinding[] = [
  row(
    "0",
    SOL,
    null,
    RDFS_LABEL,
    literal("Section of Line A - B (from 2018-04-09)"),
  ),
  row("0", SOL, null, `${ERA}hasPart`, uri(TRACK_A)),
  row(
    "0",
    SOL,
    null,
    `${ERA}lengthOfSectionOfLine`,
    literal("8.21E-1", `${XSD}double`),
  ),
  row("1", TRACK_A, SOL, RDFS_LABEL, literal("180-1 (from 2017-12-10)")),
  row(
    "1",
    TRACK_A,
    SOL,
    `${ERA}maximumPermittedSpeed`,
    literal("120", `${XSD}integer`),
  ),
  row(
    "1",
    TRACK_A,
    SOL,
    `${ERA}notApplicable`,
    uri(`${ERA}gaugingCheckLocation`),
  ),
  row("1", TRACK_A, SOL, `${ERA}trainDetectionSystem`, uri(SHARED_DETECTION)),
  row("1", TRACK_B, SOL, RDFS_LABEL, literal("180-2")),
  row("1", TRACK_B, SOL, `${ERA}trainDetectionSystem`, uri(SHARED_DETECTION)),
  row(
    "2",
    SHARED_DETECTION,
    TRACK_A,
    RDF_TYPE,
    uri(`${ERA}TrainDetectionSystem`),
    "Train Detection System",
  ),
  row(
    "2",
    SHARED_DETECTION,
    TRACK_B,
    RDF_TYPE,
    uri(`${ERA}TrainDetectionSystem`),
    "Train Detection System",
  ),
  row(
    "2",
    SHARED_DETECTION,
    TRACK_A,
    `${ERA}trainDetectionSystemType`,
    uri(`${ERA}concepts/train-detection/10`),
    "track circuit",
  ),
];

describe("toSectionOfLineDetails", () => {
  const details = toSectionOfLineDetails(DETAIL_ROWS)!;
  const [trackA, trackB] = details.children;

  it("builds SoL → tracks → linked objects, with clean labels", () => {
    expect(details.label).toBe("Section of Line A - B");
    expect(details.children.map((track) => track.label)).toEqual([
      "180-1",
      "180-2",
    ]);
    expect(trackA.children[0].classLabel).toBe("Train Detection System");
  });

  it("shows a linked object shared by two tracks under both", () => {
    expect(trackA.children[0].uri).toBe(SHARED_DETECTION);
    expect(trackB.children[0].uri).toBe(SHARED_DETECTION);
  });

  it("lists links to sub-sections and parts only as sub-sections", () => {
    const properties = trackA.parameters.map(
      (parameter) => parameter.propertyUri,
    );
    expect(properties).not.toContain(`${ERA}trainDetectionSystem`);
    expect(details.parameters.map((p) => p.propertyUri)).not.toContain(
      `${ERA}hasPart`,
    );
  });

  it("records 'not applicable' as a status, not a value", () => {
    const gauging = trackA.parameters.find(
      (parameter) => parameter.propertyUri === `${ERA}gaugingCheckLocation`,
    );
    expect(gauging?.status).toBe("notApplicable");
  });

  it("returns null when no SoL matched", () => {
    expect(toSectionOfLineDetails([])).toBeNull();
  });
});

describe("panel display", () => {
  const dictionary: ParameterDictionary = {
    [`${ERA}maximumPermittedSpeed`]: {
      label: "Maximum permitted speed",
      rinfIndex: "1.1.1.1.2.5",
      unit: "km/h",
    },
    [`${ERA}lengthOfSectionOfLine`]: {
      label: "Length of section of line",
      rinfIndex: "1.1.0.0.0.5",
      unit: "km",
    },
  };
  const details = toSectionOfLineDetails(DETAIL_ROWS)!;

  it("orders RINF indices part by part", () => {
    const at = (rinfIndex: string) => ({ label: "x", rinfIndex, unit: null });
    expect(
      compareByRinfIndex(at("1.1.1.1.2.10"), at("1.1.1.1.2.9")),
    ).toBeGreaterThan(0);
  });

  it("formats numbers with their unit and statuses as text", () => {
    const sol = toDisplayNode(details, dictionary, "")!;
    expect(formatParameterValue(sol.parameters[0], formatMessage)).toEqual([
      "0.821 km",
    ]);
    const track = sol.children[0];
    const speed = track.parameters.find(
      (p) => p.label === "Maximum permitted speed",
    )!;
    expect(formatParameterValue(speed, formatMessage)).toEqual(["120 km/h"]);
    const gauging = track.parameters.find((p) => p.status === "notApplicable")!;
    expect(formatParameterValue(gauging, formatMessage)).toEqual([
      "rinf_not_applicable",
    ]);
  });

  it("keeps only matching parameters, and the tracks that hold them", () => {
    const filtered = toDisplayNode(details, dictionary, "permitted speed")!;
    expect(filtered.parameters).toHaveLength(0);
    expect(filtered.children).toHaveLength(1);
    expect(filtered.children[0].parameters.map((p) => p.label)).toEqual([
      "Maximum permitted speed",
    ]);
    expect(toDisplayNode(details, dictionary, "no such thing")).toBeNull();
  });

  it("finds a parameter by its RINF index", () => {
    const filtered = toDisplayNode(details, dictionary, "1.1.1.1.2.5")!;
    expect(filtered.children[0].parameters).toHaveLength(1);
  });

  it("shows QUDT units as symbols", () => {
    expect(unitSymbol("http://qudt.org/vocab/unit/KiloM-PER-HR")).toBe("km/h");
    expect(unitSymbol("http://qudt.org/vocab/unit/UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("details clean-up", () => {
  it("keeps one copy of a shared object's values", () => {
    const details = toSectionOfLineDetails([
      ...DETAIL_ROWS,
      row(
        "2",
        SHARED_DETECTION,
        TRACK_B,
        `${ERA}trainDetectionSystemType`,
        uri(`${ERA}concepts/train-detection/10`),
        "track circuit",
      ),
    ])!;
    const detection = details.children[0].children[0];
    expect(detection.parameters[0].values).toHaveLength(1);
  });

  it("titles an unlabelled object by its class", () => {
    const details = toSectionOfLineDetails(DETAIL_ROWS)!;
    const shown = toDisplayNode(details, {}, "")!;
    expect(shown.children[0].children[0].title).toBe("Train Detection System");
  });
});
