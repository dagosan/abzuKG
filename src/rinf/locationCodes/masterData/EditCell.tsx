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

import { IconButton, TableCell } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { useIntl } from "react-intl";

interface EditCellProps {
  /** What is edited, for the button's accessible name, e.g. "BE". */
  subject: string;
  onEdit: () => void;
}

/** The edit button at the end of a master data row. */
export const EditCell = ({ subject, onEdit }: EditCellProps) => {
  const { formatMessage } = useIntl();
  return (
    <TableCell align="right" padding="checkbox">
      <IconButton
        size="small"
        aria-label={formatMessage({ id: "rinf_lc_md_edit" }, { subject })}
        onClick={onEdit}
      >
        <EditOutlined fontSize="small" />
      </IconButton>
    </TableCell>
  );
};
