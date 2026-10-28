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

import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import { Marker } from "react-map-gl/maplibre";
import { MarkerPopup } from "../../components/modern/Map/markers/MarkerPopup";
import type { OperationalPoint } from "../models/OperationalPoint";

const POPUP_MIN_WIDTH = 220;

interface OperationalPointPopupProps {
  point: OperationalPoint;
  onClose: () => void;
}

/**
 * Abzu's marker popup for an OP. GeoJSON circles have no DOM element to
 * anchor to, so an invisible marker at the OP's position serves as anchor.
 */
export const OperationalPointPopup = ({
  point,
  onClose,
}: OperationalPointPopupProps) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { uopid, name, typeCode, countryCode, lat, lng } = point;

  const typeLabel = typeCode
    ? formatMessage({
        id: `rinf_op_type_${typeCode}`,
        defaultMessage: typeCode,
      })
    : formatMessage({ id: "rinf_op_type_unknown" });

  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <Box ref={setAnchorEl} sx={{ width: 0, height: 0 }} />
      <MarkerPopup
        anchorEl={anchorEl}
        onClose={onClose}
        title={name}
        id={uopid}
        lat={lat}
        lng={lng}
        minWidth={POPUP_MIN_WIDTH}
      >
        <Typography variant="body2" sx={{ mt: 1 }}>
          {formatMessage({ id: "rinf_op_type" })}: {typeLabel}
        </Typography>
        {countryCode && (
          <Typography variant="body2">
            {formatMessage({ id: "rinf_country" })}: {countryCode}
          </Typography>
        )}
      </MarkerPopup>
    </Marker>
  );
};
