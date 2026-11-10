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

import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";

interface MasterDataSectionProps {
  titleId: string;
  /** Text keys of the column headings. */
  columnIds: string[];
  /** Label of the button that adds an entry; none for readers. */
  addLabelId?: string;
  onAdd?: () => void;
  /** The table rows. */
  children: ReactNode;
}

/** One master data list: its title, the button to add an entry, and the table. */
export const MasterDataSection = ({
  titleId,
  columnIds,
  addLabelId,
  onAdd,
  children,
}: MasterDataSectionProps) => {
  const { formatMessage } = useIntl();
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 1, alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
          {formatMessage({ id: titleId })}
        </Typography>
        {addLabelId && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddOutlined />}
            onClick={onAdd}
          >
            {formatMessage({ id: addLabelId })}
          </Button>
        )}
      </Stack>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ bgcolor: "background.paper" }}>
          <TableHead>
            <TableRow>
              {columnIds.map((columnId) => (
                <TableCell key={columnId}>
                  {formatMessage({ id: columnId })}
                </TableCell>
              ))}
              {addLabelId && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>{children}</TableBody>
        </Table>
      </Box>
    </Box>
  );
};
