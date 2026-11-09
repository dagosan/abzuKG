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

import { useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import type { OperationalPoint } from "../../models/OperationalPoint";
import { ChosenPositionPin } from "./ChosenPositionPin";
import { useMapContextMenu } from "./hooks/useMapContextMenu";
import { useStartRequestAtPosition } from "./hooks/useStartRequestAtPosition";
import { MapLocationMenu } from "./MapLocationMenu";
import type { MapPosition } from "./mapPosition";
import { ReferenceOperationalPointDialog } from "./ReferenceOperationalPointDialog";

/**
 * "Use this location": right-click a point on the map, choose its
 * reference OP among the nearest ones (or on the map), and a new location
 * code request opens with the point's coordinates. The menu always opens,
 * so a right-click is never silent; the item can only be used by a
 * requester (like "Request a location code" in an OP's panel) and not
 * while a form is already waiting for a pick on the map.
 */
export const RinfMapLocation = () => {
  const { actor, picking } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );
  const unavailableId =
    actor.role !== "requester"
      ? "rinf_lc_map_use_location_requester_only"
      : picking !== null
        ? "rinf_lc_map_use_location_while_picking"
        : null;
  const { openAt, close } = useMapContextMenu();
  const [chosen, setChosen] = useState<MapPosition | null>(null);
  const { withOperationalPoint, pickOnMap } = useStartRequestAtPosition();

  const takeLocation = () => {
    if (openAt && !unavailableId) setChosen(openAt.position);
    close();
  };
  const chooseOperationalPoint = (operationalPoint: OperationalPoint) => {
    if (chosen) withOperationalPoint(chosen, operationalPoint);
    setChosen(null);
  };
  const pickReferenceOnMap = () => {
    if (chosen) pickOnMap(chosen);
    setChosen(null);
  };

  const pinAt =
    openAt?.position ?? chosen ?? picking?.referencePosition ?? null;

  return (
    <>
      {pinAt && <ChosenPositionPin position={pinAt} />}
      <MapLocationMenu
        openAt={openAt}
        onUseLocation={takeLocation}
        onClose={close}
        unavailableId={unavailableId}
      />
      <ReferenceOperationalPointDialog
        position={chosen}
        onChoose={chooseOperationalPoint}
        onPickOnMap={pickReferenceOnMap}
        onClose={() => setChosen(null)}
      />
    </>
  );
};
