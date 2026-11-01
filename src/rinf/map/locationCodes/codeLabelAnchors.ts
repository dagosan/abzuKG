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

Added for the ERA RINF frontend, 2026-11-01. */

import type { DetailsKind } from "../../detailsKinds";
import type { OperationalPoint } from "../../models/OperationalPoint";
import type { SectionOfLineSummary } from "../../models/SectionOfLine";
import type { LinePositions } from "../../models/wkt";

/** A map element codes can be shown next to, with the codes RINF gives it. */
export interface CodeLabelAnchor {
  kind: DetailsKind;
  canonicalId: string;
  lat: number;
  lng: number;
  rinfCodes: string[];
}

export const anchorKey = (kind: DetailsKind, canonicalId: string): string =>
  `${kind}:${canonicalId}`;

/** Middle of the longest part, [lng, lat]: on the track, not between two parts. */
const lineMiddle = (lines: LinePositions[]): [number, number] | null => {
  const longest = lines.reduce<LinePositions | null>(
    (best, line) => (!best || line.length > best.length ? line : best),
    null,
  );
  if (!longest || longest.length === 0) return null;
  if (longest.length % 2 === 1) return longest[(longest.length - 1) / 2];
  const [first, second] = [
    longest[longest.length / 2 - 1],
    longest[longest.length / 2],
  ];
  return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
};

/** OPs and SoLs loaded for the view, keyed for lookups by element. */
export const buildCodeLabelAnchors = (
  operationalPoints: OperationalPoint[],
  sectionsOfLine: SectionOfLineSummary[],
): Map<string, CodeLabelAnchor> => {
  const anchors = new Map<string, CodeLabelAnchor>();
  operationalPoints.forEach(({ canonicalId, lat, lng, locationCodes }) =>
    anchors.set(anchorKey("operationalPoint", canonicalId), {
      kind: "operationalPoint",
      canonicalId,
      lat,
      lng,
      rinfCodes: locationCodes,
    }),
  );
  sectionsOfLine.forEach(({ canonicalId, lines, locationCodes }) => {
    const middle = lineMiddle(lines);
    if (!middle) return;
    anchors.set(anchorKey("sectionOfLine", canonicalId), {
      kind: "sectionOfLine",
      canonicalId,
      lng: middle[0],
      lat: middle[1],
      rinfCodes: locationCodes,
    });
  });
  return anchors;
};
