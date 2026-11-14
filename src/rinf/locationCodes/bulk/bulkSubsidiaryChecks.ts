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

import { isValidSubsidiaryCode } from "../model/codeFormat";
import { isSubsidiaryTypeInUse } from "../model/subsidiaryTypes";
import { BulkFailure, BulkLine, failure } from "./bulkReport";
import {
  isCompanyCode,
  locationNumberOf,
  typeCodeOf,
} from "./bulkValueFormats";

const typeFailures = (value: string, today: string): BulkFailure[] => {
  if (!value) return [];
  const typeCode = typeCodeOf(value);
  if (typeCode === null)
    return [failure("Subsidiary_Type_Code", "A1", "rinf_lc_bulk_type_format")];
  return isSubsidiaryTypeInUse(typeCode, today)
    ? []
    : [
        failure("Subsidiary_Type_Code", "BR-08", "rinf_lc_bulk_type_unknown", {
          type: typeCode,
        }),
      ];
};

/** The columns only an SLC line uses, each on its own (Annex A.2). */
export const subsidiaryLineFailures = (
  { values }: BulkLine,
  today: string,
): BulkFailure[] => {
  const parent = values.Primary_Location_Code ?? "";
  const proposed = values.Subsidiary_Location_Code ?? "";
  const allocationCompany = values.Allocation_Company_Code ?? "";
  return [
    ...(parent && locationNumberOf(parent) === null
      ? [failure("Primary_Location_Code", "A1", "rinf_lc_bulk_location_number")]
      : []),
    ...typeFailures(values.Subsidiary_Type_Code ?? "", today),
    ...(proposed && !isValidSubsidiaryCode(proposed)
      ? [
          failure(
            "Subsidiary_Location_Code",
            "A1",
            "rinf_lc_bulk_subsidiary_code",
          ),
        ]
      : []),
    ...(allocationCompany && !isCompanyCode(allocationCompany)
      ? [failure("Allocation_Company_Code", "A1", "rinf_lc_bulk_company_code")]
      : []),
  ];
};
