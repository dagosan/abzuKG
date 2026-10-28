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
import { buildDetailsQuery } from "../rinf/api/detailsQuery";
import type { SparqlBinding, SparqlTerm } from "../rinf/api/sparqlClient";
import {
  canonicalIdFromUri,
  DETAILS_KINDS,
  detailsPath,
} from "../rinf/detailsKinds";
import { toDetailsTrees } from "../rinf/models/detailsTree";
import { formatParameterValue } from "../rinf/panel/formatParameterValue";
import { toDisplayNode } from "../rinf/panel/visibleParameters";

const ERA = "http://data.europa.eu/949/";
const OP_KIND = DETAILS_KINDS.operationalPoint;
const uri = (value: string): SparqlTerm => ({ type: "uri", value });
const literal = (value: string): SparqlTerm => ({ type: "literal", value });
const formatMessage = ({ id }: { id: string }) => id;

const opRow = (
  subject: string,
  graph: string,
  predicate: string,
  object: SparqlTerm,
  objectLabel?: string,
  objectCode?: string,
): SparqlBinding => ({
  level: literal("0"),
  subject: uri(subject),
  source: uri(`${ERA}graph/${graph}`),
  p: uri(`${ERA}${predicate}`),
  o: object,
  oLabel: objectLabel ? literal(objectLabel) : undefined,
  oCode: objectCode ? literal(objectCode) : undefined,
});

const GEMBLOUX = `${ERA}operationalPoint/76ad36dda2`;
const GEMBLOUX_ROWS: SparqlBinding[] = [
  opRow(
    GEMBLOUX,
    "0088",
    "opType",
    uri(`${ERA}concepts/op-types/10`),
    "station",
  ),
  opRow(
    GEMBLOUX,
    "0088",
    "primaryLocation",
    uri(`${ERA}primaryLocation/BE00438`),
    "BE00438",
    "BE00438",
  ),
  opRow(
    GEMBLOUX,
    "0088",
    "netReference",
    uri(`${ERA}netReference/1c197068b6`),
    "Railway location of OP Gembloux, km 44.363 on line 1610",
  ),
];

describe("details kinds", () => {
  it("builds panel paths and reads ids back from canonical URIs", () => {
    expect(detailsPath("operationalPoint", "BELGB")).toBe(
      "/operational-point/BELGB",
    );
    expect(
      canonicalIdFromUri("operationalPoint", `${ERA}operationalPoint/BELGB`),
    ).toBe("BELGB");
    expect(
      canonicalIdFromUri("operationalPoint", `${ERA}sectionOfLine/X`),
    ).toBeNull();
  });

  it("queries the kind's canonical id and keeps each root's dataset", () => {
    const query = buildDetailsQuery(
      OP_KIND.canonicalPrefix,
      "BELGB",
      "2026-10-28",
    );
    expect(query).toContain(`<${ERA}operationalPoint/BELGB>`);
    expect(query).toContain("GRAPH ?sourceGraph");
  });
});

describe("operational point details", () => {
  const [gembloux] = toDetailsTrees(GEMBLOUX_ROWS, OP_KIND.hiddenProperties);
  const shown = toDisplayNode(gembloux, {}, "")!;
  const valueOf = (label: string) =>
    formatParameterValue(
      shown.parameters.find((parameter) => parameter.label === label)!,
      formatMessage,
    );

  it("lists the type, the primary location code and the railway locations", () => {
    expect(valueOf("Op type")).toEqual(["station"]);
    expect(valueOf("Primary location")).toEqual(["BE00438"]);
    expect(valueOf("Net reference")).toEqual([
      "Railway location of OP Gembloux, km 44.363 on line 1610",
    ]);
  });

  it("still hides a section of line's net reference, which is only its shape", () => {
    const [asSection] = toDetailsTrees(
      GEMBLOUX_ROWS,
      DETAILS_KINDS.sectionOfLine.hiddenProperties,
    );
    const properties = asSection.parameters.map((p) => p.propertyUri);
    expect(properties).not.toContain(`${ERA}netReference`);
  });

  it("finds the location code with the filter", () => {
    const filtered = toDisplayNode(gembloux, {}, "BE00438")!;
    expect(filtered.parameters).toHaveLength(1);
  });
});

describe("primary location codes", () => {
  it("shows the code even when the label is the station name", () => {
    const [perl] = toDetailsTrees([
      opRow(
        `${ERA}operationalPoint/d53eaae078`,
        "0080",
        "primaryLocation",
        uri(`${ERA}primaryLocation/DE18314`),
        "Perl Grenze",
        "DE18314",
      ),
    ]);
    expect(perl.parameters[0].values[0].text).toBe("DE18314 · Perl Grenze");
  });
});

describe("border point declared by two IMs", () => {
  const FROM_0087 = `${ERA}operationalPoint/e1dfd5197f`;
  const FROM_0080 = `${ERA}operationalPoint/d53eaae078`;
  const roots = toDetailsTrees([
    opRow(FROM_0087, "0087", "opName", literal("Forbach")),
    opRow(FROM_0080, "0080", "opName", literal("Forbach (Grenze)")),
  ]);

  it("keeps both declarations, ordered by IM code, each with its source", () => {
    expect(roots.map((root) => root.source)).toEqual(["0080", "0087"]);
    expect(roots.map((root) => root.uri)).toEqual([FROM_0080, FROM_0087]);
  });
});
