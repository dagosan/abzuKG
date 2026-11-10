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

import { TableCell, TableRow } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import type { SubsidiaryType } from "../model/masterData";
import { EditCell } from "./EditCell";
import { MasterDataSection } from "./MasterDataSection";
import { SubsidiaryTypeDialog } from "./SubsidiaryTypeDialog";
import { ValidityCell } from "./ValidityCell";

const NONE = "—";
const COLUMN_IDS = ["code", "name", "requesters", "retail", "valid"].map(
  (column) => `rinf_lc_md_column_${column}`,
);

interface SubsidiaryTypeTableProps {
  subsidiaryTypes: SubsidiaryType[];
  canEdit: boolean;
  today: string;
}

/** The subsidiary location code types, by code. */
export const SubsidiaryTypeTable = ({
  subsidiaryTypes,
  canEdit,
  today,
}: SubsidiaryTypeTableProps) => {
  const { formatMessage } = useIntl();
  // undefined: no dialog; null: adding a type.
  const [editing, setEditing] = useState<SubsidiaryType | null | undefined>();
  const sorted = [...subsidiaryTypes].sort((first, second) =>
    first.code.localeCompare(second.code),
  );
  const requesters = (type: SubsidiaryType): string =>
    type.requesterRoles
      .map((party) => formatMessage({ id: `rinf_lc_md_party_${party}` }))
      .join(", ") || NONE;

  return (
    <MasterDataSection
      titleId="rinf_lc_md_types_title"
      columnIds={COLUMN_IDS}
      addLabelId={canEdit ? "rinf_lc_md_add_type" : undefined}
      onAdd={() => setEditing(null)}
    >
      {sorted.map((type) => (
        <TableRow key={type.code}>
          <TableCell>{type.code}</TableCell>
          <TableCell>{type.name}</TableCell>
          <TableCell>{requesters(type)}</TableCell>
          <TableCell>
            {formatMessage({
              id: type.retailRelated ? "rinf_lc_crd_yes" : "rinf_lc_crd_no",
            })}
          </TableCell>
          <ValidityCell entry={type} today={today} />
          {canEdit && (
            <EditCell subject={type.code} onEdit={() => setEditing(type)} />
          )}
        </TableRow>
      ))}
      {editing !== undefined && (
        <SubsidiaryTypeDialog
          type={editing}
          listedCodes={subsidiaryTypes.map((type) => type.code)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </MasterDataSection>
  );
};
