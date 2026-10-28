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
import type { OperationalPointSearchResult } from "../models/OperationalPointSearchResult";

const SEPARATOR = " · ";

interface SearchResultOptionProps {
  result: OperationalPointSearchResult;
}

/** One result: the OP name, then UOPID · location code · type · country. */
export const SearchResultOption = ({ result }: SearchResultOptionProps) => {
  const { name, uopid, locationCode, type, countryCode } = result;
  const details = [uopid, locationCode, type, countryCode]
    .filter(Boolean)
    .join(SEPARATOR);
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {details}
      </Typography>
    </Box>
  );
};
