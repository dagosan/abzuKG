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
import type { Country } from "../model/masterData";
import { CountryDialog } from "./CountryDialog";
import { EditCell } from "./EditCell";
import { MasterDataSection } from "./MasterDataSection";
import { ValidityCell } from "./ValidityCell";

const NONE = "—";
const COLUMN_IDS = ["prefix", "uic", "name", "eu", "range", "valid"].map(
  (column) => `rinf_lc_md_column_${column}`,
);

interface CountryTableProps {
  countries: Country[];
  canEdit: boolean;
  today: string;
}

/** The countries codes are assigned for, by prefix. */
export const CountryTable = ({
  countries,
  canEdit,
  today,
}: CountryTableProps) => {
  const { formatMessage } = useIntl();
  // undefined: no dialog; null: adding a country.
  const [editing, setEditing] = useState<Country | null | undefined>();
  const sorted = [...countries].sort((first, second) =>
    first.isoCode.localeCompare(second.isoCode),
  );

  return (
    <MasterDataSection
      titleId="rinf_lc_md_countries_title"
      columnIds={COLUMN_IDS}
      addLabelId={canEdit ? "rinf_lc_md_add_country" : undefined}
      onAdd={() => setEditing(null)}
    >
      {sorted.map((country) => (
        <TableRow key={country.isoCode}>
          <TableCell>{country.isoCode}</TableCell>
          <TableCell>{country.uicCode ?? NONE}</TableCell>
          <TableCell>{country.name}</TableCell>
          <TableCell>
            {formatMessage({
              id: country.euMemberState ? "rinf_lc_crd_yes" : "rinf_lc_crd_no",
            })}
          </TableCell>
          <TableCell>
            {country.plcRangeStart}–{country.plcRangeEnd}
          </TableCell>
          <ValidityCell entry={country} today={today} />
          {canEdit && (
            <EditCell
              subject={country.isoCode}
              onEdit={() => setEditing(country)}
            />
          )}
        </TableRow>
      ))}
      {editing !== undefined && (
        <CountryDialog
          country={editing}
          listedCodes={countries.map((country) => country.isoCode)}
          onClose={() => setEditing(undefined)}
        />
      )}
    </MasterDataSection>
  );
};
