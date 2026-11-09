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

import { useEffect, useState } from "react";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import type { RinfLoadStatus } from "../../../state/loadStatus";
import type { MapPosition } from "../mapPosition";
import {
  fetchNearbyOperationalPoints,
  NearbyOperationalPoint,
} from "../nearbyOperationalPoints";

export interface NearbyOperationalPoints {
  status: RinfLoadStatus;
  nearby: NearbyOperationalPoint[];
}

const NOTHING_LOADED: NearbyOperationalPoints = { status: "idle", nearby: [] };

/** The OPs nearest to the point, loaded while a point is given (~2 s). */
export const useNearbyOperationalPoints = (
  position: MapPosition | null,
): NearbyOperationalPoints => {
  const endpoint = useRinfSparqlEndpoint();
  const [result, setResult] = useState<NearbyOperationalPoints>(NOTHING_LOADED);
  const latitude = position?.latitude;
  const longitude = position?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      setResult(NOTHING_LOADED);
      return;
    }
    const controller = new AbortController();
    setResult({ status: "loading", nearby: [] });
    fetchNearbyOperationalPoints(
      endpoint,
      { latitude, longitude },
      controller.signal,
    )
      .then((nearby) => setResult({ status: "loaded", nearby }))
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ status: "failed", nearby: [] });
      });
    return () => controller.abort();
  }, [endpoint, latitude, longitude]);

  return result;
};
