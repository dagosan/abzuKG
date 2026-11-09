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

import TrainOutlinedIcon from "@mui/icons-material/TrainOutlined";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import type { OperationalPoint } from "../../models/OperationalPoint";
import type { NearbyOperationalPoint } from "./nearbyOperationalPoints";

const METRES_PER_KM = 1000;
/** Below this, the distance reads better in metres. */
const SHOW_METRES_BELOW_KM = 1;

interface NearbyOperationalPointItemProps {
  nearby: NearbyOperationalPoint;
  onChoose: (operationalPoint: OperationalPoint) => void;
}

/** One OP in the list: name, UOPID and the PLCs it carries, and how far it is. */
export const NearbyOperationalPointItem = ({
  nearby,
  onChoose,
}: NearbyOperationalPointItemProps) => {
  const { formatNumber, formatMessage } = useIntl();
  const { operationalPoint, distanceKm } = nearby;
  const { name, uopid, locationCodes } = operationalPoint;
  const distance =
    distanceKm < SHOW_METRES_BELOW_KM
      ? formatMessage(
          { id: "rinf_lc_map_distance_m" },
          {
            distance: formatNumber(Math.round(distanceKm * METRES_PER_KM)),
          },
        )
      : formatMessage(
          { id: "rinf_lc_map_distance_km" },
          { distance: formatNumber(distanceKm, { maximumFractionDigits: 1 }) },
        );
  const details = [uopid, ...locationCodes].join(" · ");

  return (
    <ListItemButton onClick={() => onChoose(operationalPoint)}>
      <ListItemIcon>
        <TrainOutlinedIcon sx={{ color: "text.secondary" }} />
      </ListItemIcon>
      <ListItemText primary={name} secondary={details} />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", ml: 2, whiteSpace: "nowrap" }}
      >
        {distance}
      </Typography>
    </ListItemButton>
  );
};
