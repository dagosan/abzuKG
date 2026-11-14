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

import type { BulkColumn } from "./bulkColumns";
import { BulkFailure, BulkLine, failure } from "./bulkReport";
import {
  isCompanyCode,
  isFlag,
  isIsoDate,
  locationNumberOf,
  NUTS_MAX_LENGTH,
} from "./bulkValueFormats";

const FLAG_COLUMNS: BulkColumn[] = [
  "Container_Handling_Flag",
  "Handover_Point_Flag",
  "Freight_Possible_Flag",
  "Passenger_Possible_Flag",
];

/** A use of the location with its own validity: the flag, then start and end. */
const USE_VALIDITIES: [BulkColumn, BulkColumn, BulkColumn][] = [
  ["Freight_Possible_Flag", "Freight_Start_Validity", "Freight_End_Validity"],
  [
    "Passenger_Possible_Flag",
    "Passenger_Start_Validity",
    "Passenger_End_Validity",
  ],
];
const FLAG_SET = "1";

const flagFailures = ({ values }: BulkLine): BulkFailure[] =>
  FLAG_COLUMNS.filter(
    (column) => values[column] && !isFlag(values[column] ?? ""),
  ).map((column) => failure(column, "A1", "rinf_lc_bulk_flag"));

/** Dates of a use: well formed, only with the flag set, end not before start. */
const useValidityFailures = (
  { values }: BulkLine,
  [flag, start, end]: [BulkColumn, BulkColumn, BulkColumn],
): BulkFailure[] => {
  const startDate = values[start] ?? "";
  const endDate = values[end] ?? "";
  const given = [start, end].filter((column) => values[column]);
  const malformed = given.filter((column) => !isIsoDate(values[column] ?? ""));
  if (malformed.length > 0)
    return malformed.map((column) =>
      failure(column, "A1", "rinf_lc_bulk_date"),
    );
  if (values[flag] !== FLAG_SET)
    return given.map((column) =>
      failure(column, "A1", "rinf_lc_bulk_validity_without_flag", { flag }),
    );
  return startDate && endDate && endDate < startDate
    ? [failure(end, "A1", "rinf_lc_bulk_validity_order")]
    : [];
};

/** The columns only a PLC line uses, each on its own (Annex A.2). */
export const primaryLineFailures = (line: BulkLine): BulkFailure[] => {
  const { values } = line;
  const proposed = values.Primary_Location_Code ?? "";
  const responsibleIm = values.Responsible_IM_Code ?? "";
  return [
    ...(proposed && locationNumberOf(proposed) === null
      ? [failure("Primary_Location_Code", "A1", "rinf_lc_bulk_location_number")]
      : []),
    ...(responsibleIm && !isCompanyCode(responsibleIm)
      ? [failure("Responsible_IM_Code", "BR-06", "rinf_lc_bulk_company_code")]
      : []),
    ...((values.NUTS_Code ?? "").length > NUTS_MAX_LENGTH
      ? [
          failure("NUTS_Code", "A1", "rinf_lc_bulk_text_length", {
            max: NUTS_MAX_LENGTH,
          }),
        ]
      : []),
    ...flagFailures(line),
    ...USE_VALIDITIES.flatMap((use) => useValidityFailures(line, use)),
  ];
};
