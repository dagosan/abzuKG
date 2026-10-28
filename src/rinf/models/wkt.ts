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

/** A line as [lng, lat] positions, GeoJSON order. */
export type LinePositions = [number, number][];

const LINESTRING = /^\s*LINESTRING\s*\(([^()]*)\)\s*$/i;
const MULTILINESTRING = /^\s*MULTILINESTRING\s*\((.*)\)\s*$/i;
const PART = /\(([^()]*)\)/g;
const MIN_POSITIONS = 2;

const parsePositions = (text: string): LinePositions | null => {
  const positions = text.split(",").map((pair) => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number);
    return [lng, lat] as [number, number];
  });
  const valid = positions.every(
    ([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat),
  );
  return valid && positions.length >= MIN_POSITIONS ? positions : null;
};

/**
 * Lines from a WKT LINESTRING or MULTILINESTRING, as RINF stores SoL shapes.
 * Returns an empty list for anything else, so a bad shape is skipped, not drawn wrong.
 */
export const parseWktLines = (wkt: string): LinePositions[] => {
  const single = LINESTRING.exec(wkt);
  if (single) {
    const line = parsePositions(single[1]);
    return line ? [line] : [];
  }
  const multi = MULTILINESTRING.exec(wkt);
  if (!multi) return [];
  return Array.from(multi[1].matchAll(PART))
    .map((part) => parsePositions(part[1]))
    .filter((line): line is LinePositions => line !== null);
};
