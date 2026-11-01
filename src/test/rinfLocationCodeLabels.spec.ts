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

Added for the ERA RINF frontend, 2026-11-01.
Modified 2026-11-02: register as code versions with CRD's columns. */

import { describe, expect, it } from "vitest";
import type { CodeVersion } from "../rinf/locationCodes/model/CodeVersion";
import { aCodeVersion } from "../rinf/locationCodes/testing/codeVersionFixture";
import { buildCodeLabels } from "../rinf/map/locationCodes/buildCodeLabels";
import { buildCodeLabelAnchors } from "../rinf/map/locationCodes/codeLabelAnchors";
import type { OperationalPoint } from "../rinf/models/OperationalPoint";
import type { SectionOfLineSummary } from "../rinf/models/SectionOfLine";
import { parseLocationCodeList } from "../rinf/models/locationCodeList";
import { toOperationalPoint } from "../rinf/models/OperationalPoint";

const op = (
  canonicalId: string,
  locationCodes: string[] = [],
): OperationalPoint => ({
  uri: `http://data.europa.eu/949/operationalPoint/${canonicalId}`,
  canonicalId,
  uopid: canonicalId,
  name: canonicalId,
  lat: 50.56,
  lng: 4.69,
  locationCodes,
});

const sol = (
  canonicalId: string,
  locationCodes: string[] = [],
): SectionOfLineSummary => ({
  uri: `http://data.europa.eu/949/sectionOfLine/${canonicalId}`,
  canonicalId,
  name: canonicalId,
  lines: [
    [
      [4.0, 50.0],
      [5.0, 51.0],
    ],
  ],
  locationCodes,
});

const registered = (overrides: Partial<CodeVersion>): CodeVersion =>
  aCodeVersion({ startValidity: "2026-10-30", ...overrides });

const opLink = (canonicalId: string) => ({
  kind: "operationalPoint" as const,
  canonicalId,
  label: canonicalId,
});

const labelsFor = (
  points: OperationalPoint[],
  register: CodeVersion[],
  lines: SectionOfLineSummary[] = [],
) => buildCodeLabels(buildCodeLabelAnchors(points, lines), register);

describe("location code labels", () => {
  it("reads the space-separated codes of the map queries", () => {
    expect(parseLocationCodeList("BE00438 BE00187 BE00438 ")).toEqual([
      "BE00187",
      "BE00438",
    ]);
    expect(parseLocationCodeList(undefined)).toEqual([]);
    const point = toOperationalPoint({
      op: {
        type: "uri",
        value: "http://data.europa.eu/949/operationalPoint/x",
      },
      id: { type: "literal", value: "BELGB" },
      canonicalUri: {
        type: "uri",
        value: "http://data.europa.eu/949/operationalPoint/BELGB",
      },
      latitude: { type: "literal", value: "50.56" },
      longitude: { type: "literal", value: "4.69" },
      codes: { type: "literal", value: "BE00438" },
    });
    expect(point?.locationCodes).toEqual(["BE00438"]);
  });

  it("shows a code only RINF has as a RINF code", () => {
    expect(labelsFor([op("BELGB", ["BE00438"])], [])).toEqual([
      expect.objectContaining({
        canonicalId: "BELGB",
        chips: [{ text: "BE00438", source: "rinf" }],
      }),
    ]);
  });

  it("merges a code both RINF and the register give the same OP", () => {
    const code = registered({
      key: "BE00438",
      code: "BE00438",
      rinfLink: opLink("BELGB"),
    });
    expect(labelsFor([op("BELGB", ["BE00438"])], [code])[0].chips).toEqual([
      { text: "BE00438", source: "registerAndRinf" },
    ]);
  });

  it("marks a register code not (yet) in RINF, next to RINF's own", () => {
    const code = registered({ rinfLink: opLink("BELGB") });
    expect(labelsFor([op("BELGB", ["BE00438"])], [code])[0].chips).toEqual([
      { text: "BE00001", source: "register" },
      { text: "BE00438", source: "rinf" },
    ]);
  });

  it("places an unlinked PLC on the OP that carries it in RINF", () => {
    const code = registered({ key: "BE00438", code: "BE00438" });
    expect(labelsFor([op("BELGB", ["BE00438"])], [code])[0].chips).toEqual([
      { text: "BE00438", source: "registerAndRinf" },
    ]);
  });

  it("puts a subsidiary code with its parent PLC", () => {
    const parent = registered({ rinfLink: opLink("SE00111") });
    const subsidiary = registered({
      key: "BE00001/0000000001",
      codeType: "subsidiary",
      code: "0000000001",
      parentPrimaryCode: "BE00001",
    });
    const viaKg = registered({
      key: "BE00438/0000000002",
      codeType: "subsidiary",
      code: "0000000002",
      parentPrimaryCode: "BE00438",
    });
    const labels = labelsFor(
      [op("SE00111"), op("BELGB", ["BE00438"])],
      [parent, subsidiary, viaKg],
    );
    expect(labels.find((l) => l.canonicalId === "SE00111")?.chips).toEqual([
      { text: "BE00001", source: "register" },
      { text: "BE00001/0000000001", source: "register" },
    ]);
    expect(labels.find((l) => l.canonicalId === "BELGB")?.chips).toEqual([
      { text: "BE00438", source: "rinf" },
      { text: "BE00438/0000000002", source: "register" },
    ]);
  });

  it("places an asset's code on the asset's OP, and SoL codes mid-line", () => {
    const onTrack = registered({
      key: "BE00438/0000000003",
      codeType: "subsidiary",
      code: "0000000003",
      parentPrimaryCode: "BE00438",
      rinfLink: {
        kind: "asset",
        canonicalId: "http://data.europa.eu/949/track/x",
        label: "voie III",
        parent: opLink("BELGB"),
      },
    });
    const labels = labelsFor(
      [op("BELGB")],
      [onTrack],
      [sol("1610_BEMNG_BELGB", ["BE09999"])],
    );
    expect(labels).toEqual([
      expect.objectContaining({
        canonicalId: "BELGB",
        chips: [{ text: "BE00438/0000000003", source: "register" }],
      }),
      expect.objectContaining({
        kind: "sectionOfLine",
        lat: 50.5,
        lng: 4.5,
        chips: [{ text: "BE09999", source: "rinf" }],
      }),
    ]);
  });

  it("leaves out elements without codes and codes whose element is out of view", () => {
    const elsewhere = registered({ rinfLink: opLink("FRPNO") });
    expect(labelsFor([op("BELGB")], [elsewhere])).toEqual([]);
  });
});
