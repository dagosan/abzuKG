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
import { useIntl } from "react-intl";
import { formatParameterValue } from "./formatParameterValue";
import type { DisplayParameter } from "./visibleParameters";

const INDEX_COLUMN_WIDTH = 92;

interface ParameterRowProps {
  parameter: DisplayParameter;
}

/** One parameter: RINF index, name, and its value(s) or RINF status. */
export const ParameterRow = ({ parameter }: ParameterRowProps) => {
  const { formatMessage } = useIntl();
  const { rinfIndex, label, status } = parameter;
  const values = formatParameterValue(parameter, formatMessage);
  const hasValue = status === "value";

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        gap: 1,
        py: 0.75,
        borderBottom: 1,
        borderColor: "divider",
        listStyle: "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          flex: `0 0 ${INDEX_COLUMN_WIDTH}px`,
          color: "text.secondary",
          fontFamily: "monospace",
          pt: 0.25,
          overflowWrap: "anywhere",
        }}
      >
        {rinfIndex ?? "–"}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
        {values.map((value, position) => (
          <Typography
            key={`${position}-${value}`}
            variant="body2"
            sx={{
              fontWeight: hasValue ? 600 : 400,
              fontStyle: hasValue ? "normal" : "italic",
              color: hasValue ? "text.primary" : "text.secondary",
              overflowWrap: "anywhere",
            }}
          >
            {value}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};
