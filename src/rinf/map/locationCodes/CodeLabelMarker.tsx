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

Added for the ERA RINF frontend, 2026-11-01. */

import { Box } from "@mui/material";
import type { MouseEvent } from "react";
import { useIntl } from "react-intl";
import { Marker } from "react-map-gl/maplibre";
import { useNavigate } from "react-router-dom";
import { detailsPath } from "../../detailsKinds";
import type { CodeLabel } from "./codeLabelTypes";
import { CodeChip } from "./CodeChip";

/** Below the OP dot so the dot stays clickable; on the middle of a SoL. */
const OPERATIONAL_POINT_OFFSET: [number, number] = [0, 7];
const SECTION_OF_LINE_OFFSET: [number, number] = [0, 0];

interface CodeLabelMarkerProps {
  label: CodeLabel;
}

/** The codes of one OP or SoL; a click opens the element's panel. */
export const CodeLabelMarker = ({ label }: CodeLabelMarkerProps) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { kind, canonicalId, lat, lng, chips } = label;
  const isOperationalPoint = kind === "operationalPoint";

  const openDetails = (event: MouseEvent) => {
    event.stopPropagation();
    navigate(detailsPath(kind, canonicalId));
  };

  return (
    <Marker
      latitude={lat}
      longitude={lng}
      anchor={isOperationalPoint ? "top" : "center"}
      offset={
        isOperationalPoint ? OPERATIONAL_POINT_OFFSET : SECTION_OF_LINE_OFFSET
      }
    >
      <Box
        onClick={openDetails}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.25,
          cursor: "pointer",
        }}
      >
        {chips.map(({ text, source }) => (
          <CodeChip
            key={text}
            text={text}
            source={source}
            title={`${text} · ${formatMessage({ id: `rinf_map_codes_${source}` })}`}
          />
        ))}
      </Box>
    </Marker>
  );
};
