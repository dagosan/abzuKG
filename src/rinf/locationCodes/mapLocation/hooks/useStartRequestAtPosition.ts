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

Added for the ERA RINF frontend, 2026-11-09.
Modified 2026-11-10: the countries are master data, loaded here too. */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import type { OperationalPoint } from "../../../models/OperationalPoint";
import { initialRequestData } from "../../form/hooks/useRequestForm";
import { isCountryPrefix } from "../../model/countries";
import { useMasterData } from "../../state/useMasterData";
import { newRequestPath, PREFILL_PARAMS } from "../../page/locationCodesPath";
import {
  setPositionFromMap,
  startPicking,
} from "../../state/locationCodesSlice";
import { MapPosition, positionValue, roundedPosition } from "../mapPosition";

const COUNTRY_PREFIX_LENGTH = 2;

export interface StartRequestAtPosition {
  /** Opens a new request at the point, with this OP as its RINF element. */
  withOperationalPoint: (
    position: MapPosition,
    operationalPoint: OperationalPoint,
  ) => void;
  /** Keeps the point and lets the user click the reference OP on the map. */
  pickOnMap: (position: MapPosition) => void;
}

const positionParams = (position: MapPosition): Record<string, string> => ({
  [PREFILL_PARAMS.latitude]: positionValue(position.latitude),
  [PREFILL_PARAMS.longitude]: positionValue(position.longitude),
});

/**
 * "Use this location": a new location code request whose CRD latitude and
 * longitude are the point, and whose RINF element is the reference OP
 * (decided with Antonio, 2026-11-09). The OP's name, country and IM then
 * come from RINF as for any other request; its position does not.
 */
export const useStartRequestAtPosition = (): StartRequestAtPosition => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useMasterData();
  const actorName = useAppSelector(
    (state) => state.rinf.locationCodes.actor.name,
  );

  const withOperationalPoint = useCallback(
    (position: MapPosition, operationalPoint: OperationalPoint) => {
      const { canonicalId, name } = operationalPoint;
      const prefix = canonicalId.slice(0, COUNTRY_PREFIX_LENGTH).toUpperCase();
      dispatch(setPositionFromMap(roundedPosition(position)));
      const prefill = new URLSearchParams({
        [PREFILL_PARAMS.operationalPoint]: canonicalId,
        [PREFILL_PARAMS.name]: name,
        ...(isCountryPrefix(prefix) && { [PREFILL_PARAMS.country]: prefix }),
        ...positionParams(position),
      });
      navigate(newRequestPath(prefill));
    },
    [dispatch, navigate],
  );

  const pickOnMap = useCallback(
    (position: MapPosition) => {
      const draft = initialRequestData(
        new URLSearchParams(positionParams(position)),
        actorName,
      );
      dispatch(setPositionFromMap(roundedPosition(position)));
      dispatch(
        startPicking({
          draft,
          allowAssets: false,
          referencePosition: roundedPosition(position),
        }),
      );
    },
    [dispatch, actorName],
  );

  return { withOperationalPoint, pickOnMap };
};
