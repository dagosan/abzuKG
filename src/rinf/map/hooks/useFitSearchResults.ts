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

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { mapFittedToResults } from "../../state/parameterSearchSlice";
import { searchResultsBounds } from "../searchResultsGeoJson";

/** Room around the results, so none sits under the map's edge or its controls. */
const FIT_PADDING = 60;
/** A single OP is shown among its neighbours, not at street level. */
const FIT_MAX_ZOOM = 13;
const FIT_DURATION_MS = 800;

/** After "Show on map", zooms the map once so every result is in view. */
export const useFitSearchResults = (): void => {
  const dispatch = useAppDispatch();
  const { current: mapRef } = useMap();
  const { fitPending, places } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!fitPending || !map) return;
    const bounds = searchResultsBounds(places);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: FIT_PADDING,
        maxZoom: FIT_MAX_ZOOM,
        duration: FIT_DURATION_MS,
      });
    }
    dispatch(mapFittedToResults());
  }, [dispatch, fitPending, mapRef, places]);
};
