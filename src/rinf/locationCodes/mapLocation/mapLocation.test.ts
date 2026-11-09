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

Added for the ERA RINF frontend, 2026-11-09. */

import { describe, expect, it } from "vitest";
import type { OperationalPoint } from "../../models/OperationalPoint";
import { initialRequestData } from "../form/hooks/useRequestForm";
import {
  boxAround,
  distanceKm,
  holdsMapPosition,
  positionValue,
} from "./mapPosition";
import { nearestFirst } from "./nearbyOperationalPoints";

const GEMBLOUX = { latitude: 50.571292, longitude: 4.690778 };

const operationalPoint = (
  canonicalId: string,
  lat: number,
  lng: number,
): OperationalPoint => ({
  uri: `http://data.europa.eu/949/operationalPoint/${canonicalId}`,
  canonicalId,
  uopid: canonicalId,
  name: canonicalId,
  lat,
  lng,
  locationCodes: [],
});

describe("distances", () => {
  it("measures one degree along a meridian at 111.2 km", () => {
    const oneDegreeNorth = { ...GEMBLOUX, latitude: GEMBLOUX.latitude + 1 };
    expect(distanceKm(GEMBLOUX, oneDegreeNorth)).toBeCloseTo(111.2, 1);
  });

  it("makes a box holding the whole radius", () => {
    const box = boxAround(GEMBLOUX, 20);
    const north = { latitude: box.north, longitude: GEMBLOUX.longitude };
    const east = { latitude: GEMBLOUX.latitude, longitude: box.east };
    expect(distanceKm(GEMBLOUX, north)).toBeGreaterThanOrEqual(19.9);
    expect(distanceKm(GEMBLOUX, east)).toBeGreaterThanOrEqual(19.9);
  });
});

describe("nearestFirst", () => {
  const points = [
    operationalPoint("FAR", 50.9, 4.69),
    operationalPoint("NEAR", 50.572, 4.69),
    operationalPoint("MIDDLE", 50.6, 4.69),
  ];

  it("sorts by distance and leaves out what is beyond the radius", () => {
    const nearby = nearestFirst(GEMBLOUX, points);
    expect(nearby.map((item) => item.operationalPoint.canonicalId)).toEqual([
      "NEAR",
      "MIDDLE",
    ]);
  });

  it("keeps at most the requested number", () => {
    expect(nearestFirst(GEMBLOUX, points, 100, 1)).toHaveLength(1);
  });
});

describe("position chosen on the map", () => {
  it("is recognised while the form still holds it", () => {
    const crd = {
      latitude: positionValue(GEMBLOUX.latitude),
      longitude: positionValue(GEMBLOUX.longitude),
    };
    expect(holdsMapPosition(crd, GEMBLOUX)).toBe(true);
    expect(holdsMapPosition({ ...crd, latitude: "50.5" }, GEMBLOUX)).toBe(
      false,
    );
    expect(holdsMapPosition(crd, null)).toBe(false);
  });

  it("pre-fills latitude and longitude from the URL, in range only", () => {
    const filled = initialRequestData(
      new URLSearchParams({ op: "BELGB", lat: "50.571292", lng: "4.690778" }),
      "",
    );
    expect(filled.crd.latitude).toBe("50.571292");
    expect(filled.crd.longitude).toBe("4.690778");
    expect(filled.rinfLink?.canonicalId).toBe("BELGB");
    const outOfRange = initialRequestData(
      new URLSearchParams({ lat: "95", lng: "4.69" }),
      "",
    );
    expect(outOfRange.crd.latitude).toBe("");
  });
});
