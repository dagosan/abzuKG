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

import { formatPrimaryCode, subsidiaryKey } from "../model/codeFormat";
import type { BulkLine } from "./bulkReport";
import {
  isCountryCode,
  locationNumberOf,
  typeCodeOf,
} from "./bulkValueFormats";

/**
 * The PLC a line names, as the register writes it ("BE00438"): the proposed
 * value of a PLC line, the parent of an SLC line. Null when the line gives
 * none, or the country or number is malformed.
 */
export const primaryCodeOfLine = ({ values }: BulkLine): string | null => {
  const country = values.Country_ISO_code ?? "";
  const locationNumber = locationNumberOf(values.Primary_Location_Code ?? "");
  return isCountryCode(country) && locationNumber !== null
    ? formatPrimaryCode(country, locationNumber)
    : null;
};

/** The register's key of the SLC an SLC line proposes; null when it proposes none. */
export const subsidiaryKeyOfLine = (line: BulkLine): string | null => {
  const parent = primaryCodeOfLine(line);
  const proposed = line.values.Subsidiary_Location_Code ?? "";
  return parent && proposed ? subsidiaryKey(parent, proposed) : null;
};

/**
 * What makes two SLC lines ask for the same code (Annex A.3): parent, type,
 * proposed value and allocation company. Null when the line proposes none.
 */
export const subsidiaryIdentityOfLine = (line: BulkLine): string | null => {
  const key = subsidiaryKeyOfLine(line);
  const typeCode = typeCodeOf(line.values.Subsidiary_Type_Code ?? "");
  return key
    ? [key, typeCode, line.values.Allocation_Company_Code].join("|")
    : null;
};
