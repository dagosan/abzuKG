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

Added for the ERA Location Code Manager, 2026-11-10. */

import { Chip, Stack, TableCell } from "@mui/material";
import { useIntl } from "react-intl";
import { isValidOn } from "../model/masterData";
import { validityText } from "./validityText";

interface ValidityCellProps {
  entry: { validFrom: string | null; validTo: string | null };
  today: string;
}

/** When an entry is valid, marked when it is not in use today. */
export const ValidityCell = ({ entry, today }: ValidityCellProps) => {
  const { formatMessage } = useIntl();
  return (
    <TableCell>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <span>{validityText(entry, formatMessage)}</span>
        {!isValidOn(entry, today) && (
          <Chip
            size="small"
            label={formatMessage({ id: "rinf_lc_md_not_in_use" })}
          />
        )}
      </Stack>
    </TableCell>
  );
};
