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

import PlaceIcon from "@mui/icons-material/Place";
import { Marker } from "react-map-gl/maplibre";
import type { MapPosition } from "./mapPosition";

const PIN_SIZE = 36;

interface ChosenPositionPinProps {
  position: MapPosition;
}

/** Marks the point being used, so it stays visible while the user chooses. */
export const ChosenPositionPin = ({ position }: ChosenPositionPinProps) => (
  <Marker
    longitude={position.longitude}
    latitude={position.latitude}
    anchor="bottom"
    style={{ pointerEvents: "none" }}
  >
    <PlaceIcon
      sx={{
        fontSize: PIN_SIZE,
        color: "primary.main",
        stroke: (theme) => theme.palette.background.paper,
        strokeWidth: 1,
        display: "block",
      }}
    />
  </Marker>
);
