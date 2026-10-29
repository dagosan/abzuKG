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

import { ListItemButton, ListItemText } from "@mui/material";
import { useIntl } from "react-intl";
import { DETAILS_KINDS } from "../detailsKinds";
import type { PlaceMatch } from "../models/parameterMatches";

const SEPARATOR = " · ";

interface ResultRowProps {
  place: PlaceMatch;
  /** Readable name of the matching elements' type, e.g. "Running track". */
  elementTypeLabel: string | null;
  onOpen: (place: PlaceMatch) => void;
}

/**
 * "Gembloux – Chapelle-Dieu" /
 * "Section of line 1610_BEGBX_BECDI · BEL · IM 0088 · 2 × Running track".
 * The id tells apart places that share a name, e.g. on parallel lines.
 */
export const ResultRow = ({
  place,
  elementTypeLabel,
  onOpen,
}: ResultRowProps) => {
  const { formatMessage } = useIntl();
  const { kind, canonicalId, name, countryCode, imCode, matches } = place;
  const details = [
    `${formatMessage({ id: DETAILS_KINDS[kind].titleId })} ${canonicalId}`,
    countryCode,
    formatMessage({ id: "rinf_parameter_search_im_code" }, { code: imCode }),
    elementTypeLabel ? `${matches} × ${elementTypeLabel}` : null,
  ]
    .filter(Boolean)
    .join(SEPARATOR);

  return (
    <ListItemButton divider onClick={() => onOpen(place)}>
      <ListItemText
        primary={name}
        secondary={details}
        slotProps={{
          primary: { variant: "body2", sx: { fontWeight: 600 } },
          secondary: { variant: "caption" },
        }}
      />
    </ListItemButton>
  );
};
