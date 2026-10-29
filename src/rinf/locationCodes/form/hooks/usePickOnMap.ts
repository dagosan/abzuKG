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

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../../store/hooks";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import { detailsPath } from "../../../detailsKinds";
import { fetchPrimaryLocation } from "../../checks/kgLookups";
import { normalisePrimaryCode, parsePrimaryCode } from "../../model/codeFormat";
import type { RequestData } from "../../model/LocationCodeRequest";
import { rinfLinkPath } from "../../model/rinfLink";
import { startPicking } from "../../state/locationCodesSlice";

const MAP_OVERVIEW = "/";

/**
 * Where the map should open: the element already chosen; for an SLC, the
 * OP its parent PLC is on, so the user can pick one of its tracks; else
 * the map as it was.
 */
const startingPath = async (
  endpoint: string,
  data: RequestData,
): Promise<string> => {
  const chosen = data.rinfLink ? rinfLinkPath(data.rinfLink) : null;
  if (chosen) return chosen;
  if (
    data.codeType !== "subsidiary" ||
    !parsePrimaryCode(data.parentPrimaryCode)
  )
    return MAP_OVERVIEW;
  try {
    const parent = await fetchPrimaryLocation(
      endpoint,
      normalisePrimaryCode(data.parentPrimaryCode),
    );
    const operationalPoint = parent?.operationalPoints[0];
    return operationalPoint
      ? detailsPath("operationalPoint", operationalPoint)
      : MAP_OVERVIEW;
  } catch {
    return MAP_OVERVIEW;
  }
};

/**
 * Keeps the form and opens the map in picking mode. A PLC is positioned on
 * an OP or a section of line (Art. 9(6)); an SLC may also be one of their
 * assets — a track, siding, platform edge or tunnel.
 */
export const usePickOnMap = (data: RequestData): (() => void) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const endpoint = useRinfSparqlEndpoint();
  return useCallback(() => {
    dispatch(
      startPicking({
        draft: data,
        allowAssets: data.codeType === "subsidiary",
      }),
    );
    startingPath(endpoint, data).then((path) => navigate(path));
  }, [dispatch, navigate, endpoint, data]);
};
