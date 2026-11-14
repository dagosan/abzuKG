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

import { Box, Chip, ListItemButton, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { bulkReferenceOf } from "../bulk/bulkRequests";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { isOpen } from "../workflow/routing";

interface BulkListItemProps {
  bulkId: string;
  lines: LocationCodeRequest[];
  selected: boolean;
  onOpen: (bulkId: string) => void;
}

/** A bulk request in a list: reference, file, who asks, and how many lines are still open. */
export const BulkListItem = ({
  bulkId,
  lines,
  selected,
  onOpen,
}: BulkListItemProps) => {
  const { formatMessage } = useIntl();
  const [first] = lines;
  const open = lines.filter(isOpen).length;
  return (
    <ListItemButton
      selected={selected}
      onClick={() => onOpen(bulkId)}
      sx={{ display: "block", borderBottom: 1, borderColor: "divider", py: 1 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>
          {bulkReferenceOf(lines) ??
            formatMessage({ id: "rinf_lc_not_registered" })}
          {" · "}
          {formatMessage(
            { id: "rinf_lc_bulk_file_overline" },
            { count: lines.length },
          )}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color={open > 0 ? "info" : "default"}
          label={formatMessage(
            { id: "rinf_lc_bulk_lines_open_count" },
            { open, total: lines.length },
          )}
        />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, my: 0.25 }} noWrap>
        {first.bulk?.fileName}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
        {first.data.requester.organisation || first.submittedBy}
      </Typography>
    </ListItemButton>
  );
};
