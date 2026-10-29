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

import { Box, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import type { RinfSearchResult } from "../models/RinfSearchResult";

const SEPARATOR = " · ";

interface SearchResultOptionProps {
  result: RinfSearchResult;
}

/**
 * One result: the name, then for an OP "UOPID · location code · type ·
 * country", for a section of line "Line 0504 · 0504_BEFLT_BEFIA · country".
 */
export const SearchResultOption = ({ result }: SearchResultOptionProps) => {
  const { formatMessage } = useIntl();
  const parts =
    result.kind === "operationalPoint"
      ? [result.uopid, result.locationCode, result.type, result.countryCode]
      : [
          result.lineNumber &&
            formatMessage(
              { id: "rinf_search_line" },
              { line: result.lineNumber },
            ),
          result.canonicalId,
          result.countryCode,
        ];
  const details = parts.filter(Boolean).join(SEPARATOR);
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {result.name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {details}
      </Typography>
    </Box>
  );
};
